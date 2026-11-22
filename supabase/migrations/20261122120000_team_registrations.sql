-- =====================================================================
-- Team registration: team details + 11-player roster + one team photo.
--
-- Security model:
--   * Visitors register WITHOUT an account, but only through the
--     SECURITY DEFINER functions below. anon has no table privileges and
--     can never read, change or delete any registration or player row.
--   * Direct inserts into `registrations` are revoked for everyone, so all
--     submissions pass the same server-side validation.
--   * Team photos live in the PRIVATE bucket `team-photos` (JPEG/PNG,
--     max 5 MB). A visitor may upload exactly one object, named
--     `<registration id>/team-photo.<jpg|png>`, and only while that
--     registration is awaiting its photo (30-minute window). Only admins
--     can read (signed URLs) or delete photos.
--
-- Submission flow (no partial registrations):
--   1. submit_team_registration()          -> team + 11 players, one transaction
--   2. upload the photo (optional)          -> storage RLS checks step 1
--   3. complete_team_registration_photo()  -> verifies the object, saves path
--      or discard_team_registration()      -> rolls back if the upload failed
--   Incomplete submissions older than 30 minutes (e.g. the browser closed
--   mid-upload) are purged on the next submission.
--
-- Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- registrations: typed team columns (the `details` jsonb column is kept)
-- ---------------------------------------------------------------------
alter table public.registrations alter column user_id drop not null;

alter table public.registrations
  add column if not exists team_name      text,
  add column if not exists email          text,
  add column if not exists contact_phone  text,
  add column if not exists address_line1  text,
  add column if not exists address_line2  text,
  add column if not exists city           text,
  add column if not exists state          text,
  add column if not exists pin_code       text,
  add column if not exists photo_path     text,
  add column if not exists awaiting_photo boolean not null default false;

alter table public.registrations
  drop constraint if exists registrations_team_name_check,
  drop constraint if exists registrations_email_check,
  drop constraint if exists registrations_contact_phone_check,
  drop constraint if exists registrations_address_line1_check,
  drop constraint if exists registrations_address_line2_check,
  drop constraint if exists registrations_city_check,
  drop constraint if exists registrations_state_check,
  drop constraint if exists registrations_pin_code_check,
  drop constraint if exists registrations_photo_path_check,
  drop constraint if exists registrations_team_complete;

alter table public.registrations
  add constraint registrations_team_name_check check (team_name is null or char_length(team_name) between 2 and 60),
  add constraint registrations_email_check
    check (email is null or (char_length(email) <= 254 and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[A-Za-z]{2,}$')),
  add constraint registrations_contact_phone_check check (contact_phone is null or contact_phone ~ '^[6-9][0-9]{9}$'),
  add constraint registrations_address_line1_check check (address_line1 is null or char_length(address_line1) between 3 and 120),
  add constraint registrations_address_line2_check check (address_line2 is null or char_length(address_line2) between 1 and 120),
  add constraint registrations_city_check check (city is null or char_length(city) between 2 and 60),
  add constraint registrations_state_check check (state is null or char_length(state) between 2 and 60),
  add constraint registrations_pin_code_check check (pin_code is null or pin_code ~ '^[1-9][0-9]{5}$'),
  add constraint registrations_photo_path_check
    check (photo_path is null or photo_path ~ ('^' || id::text || '/team-photo\.(jpg|png)$')),
  -- A team registration always carries its full contact + address details.
  add constraint registrations_team_complete check (
    team_name is null or (
      email is not null and contact_phone is not null and address_line1 is not null
      and city is not null and state is not null and pin_code is not null
    )
  );

-- One active registration per team name (also stops accidental double submits).
create unique index if not exists registrations_team_name_active_unique
  on public.registrations (lower(team_name))
  where team_name is not null and status in ('pending', 'approved');

create index if not exists registrations_created_idx on public.registrations (created_at desc);

-- ---------------------------------------------------------------------
-- Player roster (exactly 11 per team registration)
-- ---------------------------------------------------------------------
create table if not exists public.registration_players (
  id               uuid primary key default gen_random_uuid(),
  registration_id  uuid not null references public.registrations (id) on delete cascade,
  player_no        smallint not null check (player_no between 1 and 13),
  full_name        text not null check (char_length(full_name) between 2 and 80),
  phone            text not null check (phone ~ '^[6-9][0-9]{9}$'),
  created_at       timestamptz not null default now(),
  constraint registration_players_unique_no unique (registration_id, player_no)
);

alter table public.registration_players enable row level security;

drop policy if exists "registration players: admin read" on public.registration_players;
drop policy if exists "registration players: admin update" on public.registration_players;
drop policy if exists "registration players: admin delete" on public.registration_players;

create policy "registration players: admin read" on public.registration_players
  for select to authenticated using (public.is_admin());
create policy "registration players: admin update" on public.registration_players
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "registration players: admin delete" on public.registration_players
  for delete to authenticated using (public.is_admin());
-- No insert policy: players are created only by submit_team_registration().

-- ---------------------------------------------------------------------
-- Privileges: no direct inserts; anon has no table access at all
-- ---------------------------------------------------------------------
drop policy if exists "registrations: user submits own" on public.registrations;

revoke all on public.registrations from anon;
revoke insert on public.registrations from authenticated;
grant select, update, delete on public.registrations to authenticated;

revoke all on public.registration_players from anon, authenticated;
grant select, update, delete on public.registration_players to authenticated;

-- ---------------------------------------------------------------------
-- Input normalisation helpers (internal — not callable through the API)
-- ---------------------------------------------------------------------
create or replace function public.registration_clean_text(value text)
returns text language sql immutable set search_path = ''
as $$
  select nullif(btrim(regexp_replace(regexp_replace(coalesce(value, ''), '[[:cntrl:]]', ' ', 'g'), '[[:space:]]+', ' ', 'g')), '')
$$;

-- Accepts "98765 43210", "+91 98765-43210", "098765 43210" -> "9876543210".
create or replace function public.registration_clean_phone(value text)
returns text language sql immutable set search_path = ''
as $$
  select case when d ~ '^(91|0)?[6-9][0-9]{9}$' then right(d, 10) else d end
  from (select regexp_replace(coalesce(value, ''), '[^0-9]', '', 'g') as d) digits
$$;

revoke all on function public.registration_clean_text(text) from public, anon, authenticated;
revoke all on function public.registration_clean_phone(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 1. Submit: validates everything server-side, inserts team + 11 players
--    atomically. Returns the new registration id.
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
begin
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

  if exists (
    select 1 from public.registrations
     where lower(team_name) = lower(v_team_name) and status in ('pending', 'approved')
  ) then
    raise exception 'A team with this name is already registered.' using errcode = '23505';
  end if;

  insert into public.registrations
    (user_id, team_name, email, contact_phone, address_line1, address_line2, city, state, pin_code, awaiting_photo)
  values
    (auth.uid(), v_team_name, v_email, v_phone, v_line1, v_line2, v_city, v_state, v_pin, coalesce(p_with_photo, false))
  returning id into v_id;

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
    insert into public.registration_players (registration_id, player_no, full_name, phone)
    values (v_id, v_player.ord, v_name, v_pphone);
  end loop;

  return v_id;
end $$;

-- ---------------------------------------------------------------------
-- 2. Storage gate: may this object be uploaded right now?
-- ---------------------------------------------------------------------
create or replace function public.can_upload_team_photo(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if object_name is null
     or object_name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/team-photo\.(jpg|png)$' then
    return false;
  end if;
  v_id := split_part(object_name, '/', 1)::uuid;
  return exists (
           select 1 from public.registrations r
            where r.id = v_id and r.awaiting_photo and r.photo_path is null
              and r.created_at > now() - interval '30 minutes'
         )
     and not exists (
           select 1 from storage.objects o
            where o.bucket_id = 'team-photos' and o.name like v_id::text || '/%'
         );
end $$;

-- ---------------------------------------------------------------------
-- 3a. Complete: verifies the uploaded object and stores its path.
-- ---------------------------------------------------------------------
create or replace function public.complete_team_registration_photo(p_registration_id uuid, p_photo_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_registration_id is null or p_photo_path is null
     or p_photo_path !~ ('^' || p_registration_id::text || '/team-photo\.(jpg|png)$') then
    raise exception 'Invalid team photo path.' using errcode = '22023';
  end if;
  if not exists (select 1 from storage.objects where bucket_id = 'team-photos' and name = p_photo_path) then
    raise exception 'The team photo upload could not be verified.' using errcode = '22023';
  end if;
  update public.registrations
     set photo_path = p_photo_path, awaiting_photo = false
   where id = p_registration_id and awaiting_photo and photo_path is null
     and created_at > now() - interval '30 minutes';
  if not found then
    raise exception 'This registration can no longer be updated. Please submit again.' using errcode = '22023';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 3b. Discard: rolls back a registration whose photo upload failed.
--     Only affects registrations still awaiting their photo.
-- ---------------------------------------------------------------------
create or replace function public.discard_team_registration(p_registration_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.registrations
   where id = p_registration_id and awaiting_photo and photo_path is null
     and created_at > now() - interval '30 minutes';
$$;

revoke all on function public.submit_team_registration(jsonb, jsonb, boolean) from public;
revoke all on function public.can_upload_team_photo(text) from public;
revoke all on function public.complete_team_registration_photo(uuid, text) from public;
revoke all on function public.discard_team_registration(uuid) from public;
grant execute on function public.submit_team_registration(jsonb, jsonb, boolean) to anon, authenticated;
grant execute on function public.can_upload_team_photo(text) to anon, authenticated;
grant execute on function public.complete_team_registration_photo(uuid, text) to anon, authenticated;
grant execute on function public.discard_team_registration(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Storage: private bucket + policies
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('team-photos', 'team-photos', false, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "team-photos: upload while registration awaits photo" on storage.objects;
drop policy if exists "team-photos: admin read" on storage.objects;
drop policy if exists "team-photos: admin delete" on storage.objects;

create policy "team-photos: upload while registration awaits photo" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'team-photos' and public.can_upload_team_photo(name));

create policy "team-photos: admin read" on storage.objects
  for select to authenticated
  using (bucket_id = 'team-photos' and public.is_admin());

create policy "team-photos: admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'team-photos' and public.is_admin());
-- No update policy: photos cannot be overwritten through the API.

notify pgrst, 'reload schema';
