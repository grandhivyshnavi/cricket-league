# Sankranthi Super Cricket League 2027

Tournament website and admin console — React 19, Vite, TypeScript, Tailwind CSS v4, Framer Motion, Supabase.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

Without Supabase credentials the app runs in **demo mode**: placeholder data lives in your browser's
localStorage and a demo organiser account is available at `/admin/login`
(`admin@sscl.demo` / `sscl-demo-2027`). Demo mode cannot touch any shared data.

| Script              | Purpose                          |
| ------------------- | -------------------------------- |
| `npm run dev`       | Dev server                       |
| `npm run typecheck` | TypeScript check                 |
| `npm test`          | Unit tests (Vitest)              |
| `npm run build`     | Typecheck + production build     |

## Connecting Supabase

1. Create a Supabase project.
2. Run every file in `supabase/migrations/` **in filename order** in the SQL editor (or `supabase db push`).
   Optionally run `supabase/seed.sql` for placeholder data.
3. Copy `.env.example` → `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. In **Authentication → Providers**, enable Email. Disable public sign-ups if only organisers need accounts.
5. Create the organiser user (Authentication → Users → Add user), then promote it in the SQL editor:

   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'organiser@example.com');
   ```

   Further admins can be promoted by an existing admin the same way. Users can never promote themselves.

## Security model

All permissions are enforced in Postgres with Row Level Security — the UI only decides what to show.

| Data                     | Visitors / users       | Admins     |
| ------------------------ | ---------------------- | ---------- |
| Teams, matches, settings | Read                   | Full write |
| Profiles                 | Own row; cannot change `role` | All |
| Registrations + players  | Submit only via `submit_team_registration()` RPC; no read | Full |
| Team photos (storage)    | Upload one photo to their own pending registration | Read (signed URLs), delete |
| Payment tables           | Read own transactions  | Read       |

Payment tables are written only by server-side code (service role / Edge Functions).

## Project structure

```
src/
  config/        Site constants (official name, routes, nav) and static marketing copy
  data/          Repository interface + Supabase and demo implementations, auth service
  state/         Auth and tournament data providers
  components/    UI primitives (ui/), layout, brand artwork (SVG)
  features/      home, leaderboard, matches, teams, admin, registration, payments
  pages/         Route components
supabase/        SQL migration (schema, RLS, triggers) and seed data
```

## Scoring

Standings (matches, wins, losses, points) are entered by admins. The app does **not** calculate points or
results. Confirming a match as completed moves it to Results and optionally records a winner/summary; the
leaderboard is then updated from **Admin → Leaderboard**. Ordering: pinned position, then points, wins and
fewest losses.

## Team registration

`/register` collects the team name, an 11-player roster (name + Indian mobile number each), team email and
contact number, address and one optional team photo (JPG/PNG, max 5 MB). Organisers review submissions in
**Admin → Registrations** (roster, signed photo link, approve / reject / delete).

Data lives in `registrations` (one row per team) and `registration_players` (11 rows, `player_no` 1–11);
photos are stored in the private `team-photos` bucket at `<registration id>/team-photo.<jpg|png>`.
Submission flow (`src/data/registrations.ts`, migrations `20261122120000_team_registrations.sql` and
`20261122130000_duplicate_prevention.sql`):

1. `submit_team_registration()` validates on the server and inserts the team + 11 players in one transaction.
2. Duplicate prevention (enforced in the database):
   * Team name, email and contact phone must each be unique across active (pending/approved) registrations.
   * A player identity (`normalized_name`, `normalized_phone`) must be unique across active registrations.
   * The same phone may be used by different players; the same name may be used with different phones.
   * Address fields are not part of uniqueness.
3. If a photo was chosen, it is uploaded; storage RLS only allows it while that registration awaits its photo.
4. `complete_team_registration_photo()` verifies the object and saves the path. If the upload or this step
   fails, `discard_team_registration()` rolls the registration back. Abandoned submissions (browser closed
   mid-upload) are shown as *Incomplete* and purged after 30 minutes.

## Payments (pending)

The Razorpay flow is planned in `src/features/payments/types.ts`, with
`payment_transactions` and `payment_webhook_events` tables already secured. No payment processing is active.

## Deployment (Vercel)

Import the repo, set the two `VITE_SUPABASE_*` environment variables, and deploy. `vercel.json` handles
SPA routing.
