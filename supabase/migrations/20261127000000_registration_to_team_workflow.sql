-- =====================================================================
-- Registration-to-team workflow
--
-- Changes:
--   1. Links public.teams to public.registrations via registration_id.
--   2. Stores a public-safe roster summary on teams (player_count,
--      player_names) so the public Teams tab can display registered
--      players without exposing phone numbers.
--   3. Automatically creates / updates / removes a teams row when a
--      registration's status changes, using a database trigger.
--   4. Provides helper functions for deterministic short_name and color.
--
-- Safe to re-run (uses CREATE OR REPLACE / ALTER … IF NOT EXISTS).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. New columns on public.teams
-- ---------------------------------------------------------------------
alter table public.teams
  add column if not exists registration_id uuid references public.registrations (id) on delete set null,
  add column if not exists player_count   int  not null default 0 check (player_count between 0 and 13),
  add column if not exists player_names   text[] not null default '{}'::text[];

-- One team per approved registration.
create unique index if not exists teams_registration_id_unique
  on public.teams (registration_id)
  where registration_id is not null;

-- ---------------------------------------------------------------------
-- 2. Helpers: generate short_name and color from team name
-- ---------------------------------------------------------------------
create or replace function public.team_short_name(p_name text)
returns text
language sql immutable strict
set search_path = public
as $$
  select coalesce(
    nullif(upper(left(regexp_replace(p_name, '[^A-Za-z0-9]', '', 'g'), 4)), ''),
    'TM'
  )
$$;

-- Simple hash-based palette so the same name always gets the same colour.
create or replace function public.team_color_from_name(p_name text)
returns text
language sql immutable strict
set search_path = public
as $$
  select (array[
    '#3b82f6', '#c3f03c', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#10b981', '#f97316', '#ec4899', '#6366f1'
  ])[mod(abs(hashtext(coalesce(p_name, ''))), 10) + 1]
$$;

-- ---------------------------------------------------------------------
-- 3. Trigger function: keep teams in sync with approved registrations
-- ---------------------------------------------------------------------
create or replace function public.sync_team_from_registration()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player_names text[];
  v_player_count int;
  v_short_name   text;
  v_color        text;
  v_existing_id  uuid;
begin
  -- Gather public-safe roster data from the registration.
  select array_agg(rp.full_name order by rp.player_no),
         count(*)
    into v_player_names, v_player_count
    from public.registration_players rp
   where rp.registration_id = new.id;

  -- When a registration is approved, upsert a team row.
  if new.status = 'approved' then
    v_short_name := public.team_short_name(new.team_name);
    v_color      := public.team_color_from_name(new.team_name);

    -- Reuse an existing team for this registration if present.
    select id into v_existing_id
      from public.teams
     where registration_id = new.id
     limit 1;

    if v_existing_id is not null then
      update public.teams
         set name         = new.team_name,
             short_name   = v_short_name,
             city         = new.city,
             player_count = coalesce(v_player_count, 0),
             player_names = coalesce(v_player_names, '{}'::text[]),
             color        = v_color,
             updated_at   = now()
       where id = v_existing_id;
    else
      -- Avoid duplicate team name conflicts by reusing an unlinked team
      -- with the same name if one exists (e.g. manually created).
      select id into v_existing_id
        from public.teams
       where lower(btrim(name)) = lower(btrim(new.team_name))
       limit 1;

      if v_existing_id is not null then
        update public.teams
           set registration_id = new.id,
               player_count    = coalesce(v_player_count, 0),
               player_names    = coalesce(v_player_names, '{}'::text[]),
               updated_at      = now()
         where id = v_existing_id;
      else
        insert into public.teams
          (name, short_name, city, logo_url, color,
           played, won, lost, points,
           registration_id, player_count, player_names)
        values
          (new.team_name,
           v_short_name,
           new.city,
           null,
           v_color,
           0, 0, 0, 0,
           new.id,
           coalesce(v_player_count, 0),
           coalesce(v_player_names, '{}'::text[]));
      end if;
    end if;
  else
    -- Pending / rejected / cancelled: remove the linked team row.
    delete from public.teams where registration_id = new.id;
  end if;

  return new;
end $$;

-- ---------------------------------------------------------------------
-- 4. Trigger on registration status changes
-- ---------------------------------------------------------------------
drop trigger if exists registrations_sync_team on public.registrations;
create trigger registrations_sync_team
  after update of status on public.registrations
  for each row
  execute function public.sync_team_from_registration();

-- ---------------------------------------------------------------------
-- 5. Backfill: create teams for any already-approved registrations
-- ---------------------------------------------------------------------
insert into public.teams
  (name, short_name, city, logo_url, color,
   played, won, lost, points,
   registration_id, player_count, player_names)
select
  r.team_name,
  public.team_short_name(r.team_name),
  r.city,
  null,
  public.team_color_from_name(r.team_name),
  0, 0, 0, 0,
  r.id,
  coalesce((select count(*) from public.registration_players rp where rp.registration_id = r.id), 0),
  coalesce((select array_agg(rp.full_name order by rp.player_no)
            from public.registration_players rp
            where rp.registration_id = r.id), '{}'::text[])
from public.registrations r
where r.status = 'approved'
  and not exists (select 1 from public.teams t where t.registration_id = r.id)
  and not exists (select 1 from public.teams t where lower(btrim(t.name)) = lower(btrim(r.team_name)));

-- ---------------------------------------------------------------------
-- 6. Notify PostgREST to reload the schema cache
-- ---------------------------------------------------------------------
notify pgrst, 'reload schema';
