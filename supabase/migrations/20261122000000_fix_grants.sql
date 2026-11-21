-- =====================================================================
-- Fix: Grant table-level permissions to anon and authenticated roles.
--
-- RLS policies alone are not enough — Supabase also requires explicit
-- GRANT statements so the PostgREST proxy can access the tables at all.
-- Without these, every query returns "permission denied for table X".
--
-- Also: allow admins to SELECT all profiles (needed for user management).
-- =====================================================================

-- Public tournament data: everyone can read, authenticated can write (RLS decides who)
GRANT SELECT ON public.teams TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.teams TO authenticated;

GRANT SELECT ON public.matches TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.matches TO authenticated;

GRANT SELECT ON public.tournament_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.tournament_settings TO authenticated;

-- Profiles: authenticated users can read and update (RLS decides which rows)
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- Registrations
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registrations TO authenticated;

-- Payment tables (read only for clients; writes are service-role only)
GRANT SELECT ON public.payment_transactions TO authenticated;

-- Allow admins to read ALL profiles for the user management tab.
-- The previous policy only allowed reading your own row.
DROP POLICY IF EXISTS "profiles: read own" ON public.profiles;
DROP POLICY IF EXISTS "profiles: read own or admin" ON public.profiles;

CREATE POLICY "profiles: read own or admin reads all" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());
