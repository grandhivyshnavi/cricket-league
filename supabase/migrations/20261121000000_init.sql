-- =====================================================================
-- Sankranthi Super Cricket League 2027 — initial schema
-- Security model:
--   * Everyone (anon + authenticated) can READ public tournament data.
--   * Only admins (profiles.role = 'admin') can WRITE tournament data.
--   * Users can only create their own registration (status 'pending').
--   * No user can grant themselves the admin role.
--   * Payment tables are written exclusively by server-side code
--     (service role / Edge Functions).
-- =====================================================================


create type public.app_role as enum ('admin', 'user');
create type public.match_status as enum ('upcoming', 'completed');
create type public.registration_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type public.payment_status as enum ('created', 'attempted', 'paid', 'failed', 'refunded');

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Profiles & roles
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (char_length(full_name) <= 120),
  role        public.app_role not null default 'user',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- SECURITY DEFINER so policies can check the caller's role without
-- recursively evaluating RLS on profiles.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Every new auth user gets a profile with the default 'user' role.
-- Sign-up metadata can never set the role.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(new.raw_user_meta_data ->> 'full_name', 120));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Blocks role changes by API callers who are not already admins.
-- (SQL editor / service role sessions have no 'anon'/'authenticated'
-- JWT role, so organisers can promote the first admin manually.)
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and coalesce(auth.role(), '') in ('anon', 'authenticated')
     and not public.is_admin() then
    raise exception 'Only administrators can change roles' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.guard_profile_role();

alter table public.profiles enable row level security;

create policy "profiles: read own or admin reads all" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

create policy "profiles: update own or admin" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
-- No insert/delete policies: rows are created by the trigger above and
-- removed via auth.users cascade.

-- ---------------------------------------------------------------------
-- Teams (also hold leaderboard standings, entered by admins)
-- ---------------------------------------------------------------------
create table public.teams (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(btrim(name)) between 2 and 60),
  short_name   text not null check (short_name ~ '^[A-Za-z0-9]{2,4}$'),
  city         text check (char_length(city) <= 60),
  logo_url     text check (logo_url is null or logo_url ~ '^https://'),
  color        text not null default '#3b82f6' check (color ~ '^#[0-9a-fA-F]{6}$'),
  played       integer not null default 0 check (played >= 0),
  won          integer not null default 0 check (won >= 0),
  lost         integer not null default 0 check (lost >= 0),
  points       integer not null default 0,
  manual_rank  integer check (manual_rank is null or manual_rank > 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint teams_results_le_played check (won + lost <= played)
);

create unique index teams_name_unique on public.teams (lower(btrim(name)));

create trigger teams_updated_at before update on public.teams
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Matches
-- ---------------------------------------------------------------------
create table public.matches (
  id              uuid primary key default gen_random_uuid(),
  team1_id        uuid not null references public.teams (id) on delete restrict,
  team2_id        uuid not null references public.teams (id) on delete restrict,
  scheduled_at    timestamptz not null,
  venue           text not null check (char_length(btrim(venue)) between 2 and 120),
  status          public.match_status not null default 'upcoming',
  winner_id       uuid references public.teams (id) on delete restrict,
  result_summary  text check (char_length(result_summary) <= 200),
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint matches_distinct_teams check (team1_id <> team2_id),
  constraint matches_winner_participant check (winner_id is null or winner_id in (team1_id, team2_id)),
  constraint matches_completion_state check ((status = 'completed') = (completed_at is not null)),
  constraint matches_upcoming_has_no_result check (status = 'completed' or (winner_id is null and result_summary is null))
);

create index matches_status_scheduled_idx on public.matches (status, scheduled_at);
create index matches_team1_idx on public.matches (team1_id);
create index matches_team2_idx on public.matches (team2_id);

create trigger matches_updated_at before update on public.matches
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Tournament settings (single row)
-- ---------------------------------------------------------------------
create table public.tournament_settings (
  id                      smallint primary key default 1 check (id = 1),
  tagline                 text check (char_length(tagline) <= 80),
  description             text check (char_length(description) <= 320),
  start_date              date,
  end_date                date,
  teams_count_override    integer check (teams_count_override >= 0),
  matches_count_override  integer check (matches_count_override >= 0),
  days_override           integer check (days_override >= 0),
  prize_pool              text check (char_length(prize_pool) <= 16),
  promo_video_url         text check (promo_video_url is null or promo_video_url ~ '^https://'),
  updated_at              timestamptz not null default now(),
  constraint settings_date_order check (end_date is null or start_date is null or end_date >= start_date)
);

insert into public.tournament_settings (id) values (1) on conflict do nothing;

create trigger tournament_settings_updated_at before update on public.tournament_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- RLS: public read, admin write
-- ---------------------------------------------------------------------
alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.tournament_settings enable row level security;

create policy "teams: public read" on public.teams for select to anon, authenticated using (true);
create policy "teams: admin insert" on public.teams for insert to authenticated with check (public.is_admin());
create policy "teams: admin update" on public.teams for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "teams: admin delete" on public.teams for delete to authenticated using (public.is_admin());

create policy "matches: public read" on public.matches for select to anon, authenticated using (true);
create policy "matches: admin insert" on public.matches for insert to authenticated with check (public.is_admin());
create policy "matches: admin update" on public.matches for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "matches: admin delete" on public.matches for delete to authenticated using (public.is_admin());

create policy "settings: public read" on public.tournament_settings for select to anon, authenticated using (true);
create policy "settings: admin insert" on public.tournament_settings for insert to authenticated with check (public.is_admin());
create policy "settings: admin update" on public.tournament_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- Registrations (fields to be confirmed by the organisers -> `details`)
-- ---------------------------------------------------------------------
create table public.registrations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  details     jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  status      public.registration_status not null default 'pending',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index registrations_user_idx on public.registrations (user_id);

create trigger registrations_updated_at before update on public.registrations
  for each row execute function public.set_updated_at();

alter table public.registrations enable row level security;

-- The ONLY write a regular user may perform: submit their own registration.
create policy "registrations: user submits own" on public.registrations
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

create policy "registrations: read own or admin" on public.registrations
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

create policy "registrations: admin update" on public.registrations
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "registrations: admin delete" on public.registrations
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------
-- Payments (future Razorpay integration — written only server-side)
-- No card/UPI/bank details are ever stored here.
-- ---------------------------------------------------------------------
create table public.payment_transactions (
  id                   uuid primary key default gen_random_uuid(),
  registration_id      uuid not null references public.registrations (id) on delete restrict,
  user_id              uuid not null references auth.users (id) on delete restrict,
  provider             text not null default 'razorpay' check (provider = 'razorpay'),
  provider_order_id    text unique,
  provider_payment_id  text unique,
  amount_paise         integer not null check (amount_paise > 0),
  currency             char(3) not null default 'INR',
  status               public.payment_status not null default 'created',
  failure_reason       text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index payment_transactions_registration_idx on public.payment_transactions (registration_id);

create trigger payment_transactions_updated_at before update on public.payment_transactions
  for each row execute function public.set_updated_at();

-- Idempotency log for verified Razorpay webhooks.
create table public.payment_webhook_events (
  event_id     text primary key,
  event_type   text not null,
  payload      jsonb not null,
  received_at  timestamptz not null default now()
);

alter table public.payment_transactions enable row level security;
alter table public.payment_webhook_events enable row level security;

create policy "payments: read own or admin" on public.payment_transactions
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
-- No insert/update/delete policies for clients on payment tables:
-- only the service role (Edge Functions) can write them.
-- payment_webhook_events has no client policies at all.

-- ---------------------------------------------------------------------
-- Table-level grants (required by Supabase/PostgREST in addition to RLS)
-- ---------------------------------------------------------------------
grant select on public.teams to anon, authenticated;
grant insert, update, delete on public.teams to authenticated;

grant select on public.matches to anon, authenticated;
grant insert, update, delete on public.matches to authenticated;

grant select on public.tournament_settings to anon, authenticated;
grant insert, update on public.tournament_settings to authenticated;

grant select, update on public.profiles to authenticated;

grant select, insert, update, delete on public.registrations to authenticated;
grant select on public.payment_transactions to authenticated;

-- ---------------------------------------------------------------------
-- Realtime: push public tournament changes to connected browsers
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.teams, public.matches, public.tournament_settings;
