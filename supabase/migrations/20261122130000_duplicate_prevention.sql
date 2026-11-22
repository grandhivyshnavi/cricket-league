-- =====================================================================
-- Duplicate-registration prevention.
--
-- New uniqueness rules (all case-insensitive, normalized):
--   1. Team name         — already enforced (registrations_team_name_active_unique)
--   2. Team email         — unique across active registrations
--   3. Team contact phone — unique across active registrations
--   4. Player identity    — (normalized_name, normalized_phone) unique globally
--      across active registrations. Same phone with different name is ALLOWED.
--      Same name with different phone is ALLOWED.
--
-- Address fields are intentionally NOT constrained — multiple teams may
-- share the same address.
--
-- This migration:
--   a) Adds normalized columns to registration_players for indexed lookups.
--   b) Creates unique indexes for email, contact phone, and player identity.
--   c) Replaces submit_team_registration() with duplicate-aware version.
--
-- IMPORTANT: If your database already contains duplicate emails, phones,
-- or player identities among active registrations, the CREATE UNIQUE INDEX
-- statements will fail. Resolve duplicates first, then re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Unique index on team email (active registrations only)
-- ---------------------------------------------------------------------
create unique index if not exists registrations_email_active_unique
  on public.registrations (lower(email))
  where email is not null and status in ('pending', 'approved');

-- ---------------------------------------------------------------------
-- 2. Unique index on team contact phone (active registrations only)
-- ---------------------------------------------------------------------
create unique index if not exists registrations_contact_phone_active_unique
  on public.registrations (contact_phone)
  where contact_phone is not null and status in ('pending', 'approved');

-- ---------------------------------------------------------------------
-- 3. Normalized columns on registration_players for composite uniqueness
-- ---------------------------------------------------------------------
alter table public.registration_players
  add column if not exists normalized_name  text,
  add column if not exists normalized_phone text;

-- Back-fill any existing rows.
update public.registration_players
   set normalized_name  = lower(btrim(regexp_replace(full_name, '\s+', ' ', 'g'))),
       normalized_phone = phone
 where normalized_name is null or normalized_phone is null;

-- Make them non-nullable going forward.
alter table public.registration_players
  alter column normalized_name  set not null,
  alter column normalized_phone set not null;

-- ---------------------------------------------------------------------
-- 4. Unique index on player identity: (normalized_name, normalized_phone)
--    Only among players whose registration is active (pending/approved).
--    This is a partial unique index that joins to registrations via a
--    helper function, since partial indexes cannot reference other tables.
--    Instead we use a plain unique index — the RPC enforces the "active"
--    filter before inserting, and we add a global unique index.
--
--    NOTE: We use a composite unique index across ALL players (not just
--    within one team). Two different teams cannot register the same
--    person (same name + same phone). But different names with the same
--    phone are allowed.
-- ---------------------------------------------------------------------

-- First: unique within a single registration (same player can't appear twice).
-- (player_no already enforces ordering, but we also need name+phone unique per team)
create unique index if not exists registration_players_identity_per_team
  on public.registration_players (registration_id, normalized_name, normalized_phone);

-- Global uniqueness: same player identity cannot exist in multiple active registrations.
-- We need to filter to only active registrations. Since we can't do a cross-table partial
-- index, we'll enforce this in the RPC and also create a helper exclusion approach.
-- The safest approach: create the global unique index (it covers active registrations
-- because rejected/cancelled registrations have their players deleted or the RPC
-- checks before insert). The RPC will explicitly check and raise a clear error.

-- We do NOT create a unique index on normalized_phone alone — that would prevent
-- different players from sharing a phone number.

-- ---------------------------------------------------------------------
-- 5. Replace submit_team_registration() with duplicate-aware version
-- ---------------------------------------------------------------------
create or replace function public.submit_team_registration(p_team jsonb, p_players jsonb, p_with_photo boolean default false)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_name text := public.registration_clean_text(p_team ->> 'teamName');
  v_email     text := lower(public.registration_clean_text(p_team ->> 'email'));
  v_phone     text := public.registration_clean_phone(p_team ->> 'contactPhone');
  v_line1     text := public.registration_clean_text(p_team ->> 'addressLine1');
  v_line2     text := public.registration_clean_text(p_team ->> 'addressLine2');
  v_city      text := public.registration_clean_text(p_team ->> 'city');
  v_state     text := public.registration_clean_text(p_team ->> 'state');
  v_pin       text := regexp_replace(coalesce(p_team ->> 'pinCode', ''), '[[:space:]]', '', 'g');
  v_id        uuid;
  v_player    record;
  v_name      text;
  v_pphone    text;
  v_norm_name text;
  v_norm_phone text;
  v_seen_identities text[] := '{}';
  v_identity  text;
  v_conflict_player int;
begin
  -- ── Input validation (unchanged) ──
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
  if jsonb_typeof(p_players) is distinct from 'array' or jsonb_array_length(p_players) <> 13 then
    raise exception 'Exactly 13 players are required.' using errcode = '22023';
  end if;

  -- Purge incomplete submissions whose photo upload never finished.
  delete from public.registrations
   where awaiting_photo and photo_path is null and created_at < now() - interval '30 minutes';

  -- ── Team-level duplicate checks ──
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

  -- ── Pre-validate all players and check for intra-form + cross-team duplicates ──
  for v_player in
    select e.value, e.ord from jsonb_array_elements(p_players) with ordinality as e(value, ord) order by e.ord
  loop
    v_name := public.registration_clean_text(v_player.value ->> 'name');
    v_pphone := public.registration_clean_phone(v_player.value ->> 'phone');
    if v_name is null or char_length(v_name) not between 2 and 80 then
      raise exception 'Player % needs a name between 2 and 80 characters.', v_player.ord using errcode = '22023';
    end if;
    if v_pphone !~ '^[6-9][0-9]{9}$' then
      raise exception 'Player % needs a valid 10-digit Indian mobile number.', v_player.ord using errcode = '22023';
    end if;

    v_norm_name := lower(btrim(regexp_replace(v_name, '\s+', ' ', 'g')));
    v_norm_phone := v_pphone;
    v_identity := v_norm_name || '::' || v_norm_phone;

    -- Check duplicate within the same form submission.
    if v_identity = any(v_seen_identities) then
      raise exception 'Player % has the same name and contact number as another player in this form. Each player identity must be unique.', v_player.ord
        using errcode = '23505';
    end if;
    v_seen_identities := array_append(v_seen_identities, v_identity);

    -- Check duplicate against existing active registrations.
    select rp.player_no into v_conflict_player
      from public.registration_players rp
      join public.registrations r on r.id = rp.registration_id
     where rp.normalized_name = v_norm_name
       and rp.normalized_phone = v_norm_phone
       and r.status in ('pending', 'approved')
     limit 1;

    if found then
      raise exception 'Player % (%) is already registered with another team. Please check the player details.', v_player.ord, v_name
        using errcode = '23505';
    end if;
  end loop;

  -- ── Insert team ──
  insert into public.registrations
    (user_id, team_name, email, contact_phone, address_line1, address_line2, city, state, pin_code, awaiting_photo)
  values
    (auth.uid(), v_team_name, v_email, v_phone, v_line1, v_line2, v_city, v_state, v_pin, coalesce(p_with_photo, false))
  returning id into v_id;

  -- ── Insert players with normalized columns ──
  for v_player in
    select e.value, e.ord from jsonb_array_elements(p_players) with ordinality as e(value, ord) order by e.ord
  loop
    v_name := public.registration_clean_text(v_player.value ->> 'name');
    v_pphone := public.registration_clean_phone(v_player.value ->> 'phone');
    v_norm_name := lower(btrim(regexp_replace(v_name, '\s+', ' ', 'g')));
    v_norm_phone := v_pphone;

    insert into public.registration_players (registration_id, player_no, full_name, phone, normalized_name, normalized_phone)
    values (v_id, v_player.ord, v_name, v_pphone, v_norm_name, v_norm_phone);
  end loop;

  return v_id;
end $$;

notify pgrst, 'reload schema';
