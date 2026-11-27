-- =====================================================================
-- Registration window enforcement + flexible player roster.
--
-- Changes:
--   1. Adds registration_opens / registration_closes columns to
--      tournament_settings so the window can be managed from the admin.
--      Defaults: 2026-12-01 → 2026-12-25.
--
--   2. Updates tournament start_date to 2026-12-26 in the seed row.
--
--   3. Replaces submit_team_registration() with a version that:
--        a) Accepts 1–13 players instead of exactly 13.
--        b) Enforces the registration window using the dates stored in
--           tournament_settings (Asia/Kolkata / IST).  Frontend date
--           gating is a convenience only — the backend is authoritative.
--
-- Safe to re-run (uses CREATE OR REPLACE / ALTER … IF NOT EXISTS).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Registration window columns on tournament_settings
-- ---------------------------------------------------------------------
alter table public.tournament_settings
  add column if not exists registration_opens  date,
  add column if not exists registration_closes date;

-- Seed the default window for the existing settings row.
update public.tournament_settings
   set registration_opens  = coalesce(registration_opens,  '2026-12-01'),
       registration_closes = coalesce(registration_closes, '2026-12-25'),
       start_date          = coalesce(start_date,          '2026-12-26'),
       end_date            = coalesce(end_date,            '2027-01-15')
 where id = 1;

-- Add a check so the window order is valid when set.
alter table public.tournament_settings
  drop constraint if exists settings_reg_window_order;
alter table public.tournament_settings
  add constraint settings_reg_window_order
    check (registration_closes is null or registration_opens is null
           or registration_closes >= registration_opens);

-- ---------------------------------------------------------------------
-- 2. Expose the new columns to the frontend via PostgREST
--    (tournament_settings already has "settings: public read" RLS)
-- ---------------------------------------------------------------------
-- No extra grants needed — authenticated/anon already have SELECT on
-- tournament_settings from the init migration.

-- ---------------------------------------------------------------------
-- 3. Replace submit_team_registration() — flexible players + window check
-- ---------------------------------------------------------------------
create or replace function public.submit_team_registration(
  p_team       jsonb,
  p_players    jsonb,
  p_with_photo boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_name  text := public.registration_clean_text(p_team ->> 'teamName');
  v_email      text := lower(public.registration_clean_text(p_team ->> 'email'));
  v_phone      text := public.registration_clean_phone(p_team ->> 'contactPhone');
  v_line1      text := public.registration_clean_text(p_team ->> 'addressLine1');
  v_line2      text := public.registration_clean_text(p_team ->> 'addressLine2');
  v_city       text := public.registration_clean_text(p_team ->> 'city');
  v_state      text := public.registration_clean_text(p_team ->> 'state');
  v_pin        text := regexp_replace(coalesce(p_team ->> 'pinCode', ''), '[[:space:]]', '', 'g');
  v_id         uuid;
  v_player     record;
  v_name       text;
  v_pphone     text;
  v_norm_name  text;
  v_norm_phone text;
  v_seen_identities text[] := '{}';
  v_identity   text;
  v_conflict_player int;
  v_player_count int;
  v_today      date;
  v_opens      date;
  v_closes     date;
begin
  -- ── Registration window check (IST / Asia/Kolkata) ──────────────────
  -- Use AT TIME ZONE so the boundary is always midnight IST regardless of
  -- where the database server is hosted.
  v_today  := (now() at time zone 'Asia/Kolkata')::date;

  select registration_opens, registration_closes
    into v_opens, v_closes
    from public.tournament_settings
   where id = 1;

  if v_opens is not null and v_today < v_opens then
    raise exception 'Registrations are not open yet. They open on %.', to_char(v_opens, 'DD Month YYYY')
      using errcode = '22023';
  end if;

  if v_closes is not null and v_today > v_closes then
    raise exception 'The registration deadline was %. Registrations are now closed.', to_char(v_closes, 'DD Month YYYY')
      using errcode = '22023';
  end if;

  -- ── Photo required ──────────────────────────────────────────────────
  if not coalesce(p_with_photo, false) then
    raise exception 'A team photo is required. Please upload a team photo before registering.' using errcode = '22023';
  end if;

  -- ── Basic input validation ──────────────────────────────────────────
  if jsonb_typeof(p_team) is distinct from 'object' then
    raise exception 'Invalid registration data.' using errcode = '22023';
  end if;
  if v_team_name is null or char_length(v_team_name) not between 2 and 60 then
    raise exception 'Team name must be between 2 and 60 characters.' using errcode = '22023';
  end if;
  if v_email is null or char_length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[A-Za-z]{2,}$' then
    raise exception 'Enter a valid email address.' using errcode = '22023';
  end if;
  if v_phone !~ '^[6-9][0-9]{9}$' then
    raise exception 'Enter a valid 10-digit Indian mobile number for the team contact.' using errcode = '22023';
  end if;
  if v_line1 is null or char_length(v_line1) not between 3 and 120 then
    raise exception 'Address line 1 must be between 3 and 120 characters.' using errcode = '22023';
  end if;
  if v_line2 is not null and char_length(v_line2) > 120 then
    raise exception 'Address line 2 must be at most 120 characters.' using errcode = '22023';
  end if;
  if v_city is null or char_length(v_city) not between 2 and 60 then
    raise exception 'Enter a valid city.' using errcode = '22023';
  end if;
  if v_state is null or char_length(v_state) not between 2 and 60 then
    raise exception 'Enter a valid state.' using errcode = '22023';
  end if;
  if v_pin !~ '^[1-9][0-9]{5}$' then
    raise exception 'Enter a valid 6-digit PIN code.' using errcode = '22023';
  end if;

  -- ── Player array validation ─────────────────────────────────────────
  if jsonb_typeof(p_players) is distinct from 'array' then
    raise exception 'Invalid player data.' using errcode = '22023';
  end if;

  v_player_count := jsonb_array_length(p_players);
  if v_player_count not between 1 and 13 then
    raise exception 'Between 1 and 13 players are required (got %).', v_player_count
      using errcode = '22023';
  end if;

  -- Purge incomplete submissions whose photo upload never finished.
  delete from public.registrations
   where awaiting_photo and photo_path is null and created_at < now() - interval '30 minutes';

  -- ── Team-level duplicate checks ─────────────────────────────────────
  if exists (
    select 1 from public.registrations
     where lower(team_name) = lower(v_team_name) and status in ('pending', 'approved')
  ) then
    raise exception 'This team name is already registered. Please choose a different team name.'
      using errcode = '23505';
  end if;

  if exists (
    select 1 from public.registrations
     where lower(email) = v_email and status in ('pending', 'approved')
  ) then
    raise exception 'This email address is already associated with another team registration.'
      using errcode = '23505';
  end if;

  if exists (
    select 1 from public.registrations
     where contact_phone = v_phone and status in ('pending', 'approved')
  ) then
    raise exception 'This contact number is already associated with another team registration.'
      using errcode = '23505';
  end if;

  -- ── Pre-validate all players; check intra-form + cross-team duplicates ──
  for v_player in
    select e.value, e.ord
      from jsonb_array_elements(p_players) with ordinality as e(value, ord)
     order by e.ord
  loop
    v_name   := public.registration_clean_text(v_player.value ->> 'name');
    v_pphone := public.registration_clean_phone(v_player.value ->> 'phone');

    if v_name is null or char_length(v_name) not between 2 and 80 then
      raise exception 'Player % needs a name between 2 and 80 characters.', v_player.ord
        using errcode = '22023';
    end if;
    if v_pphone !~ '^[6-9][0-9]{9}$' then
      raise exception 'Player % needs a valid 10-digit Indian mobile number.', v_player.ord
        using errcode = '22023';
    end if;

    v_norm_name  := lower(btrim(regexp_replace(v_name, '\s+', ' ', 'g')));
    v_norm_phone := v_pphone;
    v_identity   := v_norm_name || '::' || v_norm_phone;

    -- Duplicate within the same form.
    if v_identity = any(v_seen_identities) then
      raise exception 'Player % has the same name and contact number as another player in this form. Each player identity must be unique.', v_player.ord
        using errcode = '23505';
    end if;
    v_seen_identities := array_append(v_seen_identities, v_identity);

    -- Duplicate against existing active registrations.
    select rp.player_no into v_conflict_player
      from public.registration_players rp
      join public.registrations r on r.id = rp.registration_id
     where rp.normalized_name  = v_norm_name
       and rp.normalized_phone = v_norm_phone
       and r.status in ('pending', 'approved')
     limit 1;

    if found then
      raise exception 'Player % (%) is already registered with another team. Please check the player details.', v_player.ord, v_name
        using errcode = '23505';
    end if;
  end loop;

  -- ── Insert team ──────────────────────────────────────────────────────
  insert into public.registrations
    (user_id, team_name, email, contact_phone, address_line1, address_line2,
     city, state, pin_code, awaiting_photo)
  values
    (auth.uid(), v_team_name, v_email, v_phone, v_line1, v_line2,
     v_city, v_state, v_pin, coalesce(p_with_photo, false))
  returning id into v_id;

  -- ── Insert players with normalized columns ───────────────────────────
  for v_player in
    select e.value, e.ord
      from jsonb_array_elements(p_players) with ordinality as e(value, ord)
     order by e.ord
  loop
    v_name       := public.registration_clean_text(v_player.value ->> 'name');
    v_pphone     := public.registration_clean_phone(v_player.value ->> 'phone');
    v_norm_name  := lower(btrim(regexp_replace(v_name, '\s+', ' ', 'g')));
    v_norm_phone := v_pphone;

    insert into public.registration_players
      (registration_id, player_no, full_name, phone, normalized_name, normalized_phone)
    values
      (v_id, v_player.ord, v_name, v_pphone, v_norm_name, v_norm_phone);
  end loop;

  return v_id;
end $$;

-- Keep existing grants (anon + authenticated can call it).
revoke all on function public.submit_team_registration(jsonb, jsonb, boolean) from public;
grant execute on function public.submit_team_registration(jsonb, jsonb, boolean) to anon, authenticated;

-- Notify PostgREST to reload the schema cache.
notify pgrst, 'reload schema';
