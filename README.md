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
2. Run `supabase/migrations/20261121000000_init.sql` in the SQL editor (or `supabase db push`).
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
| Registrations            | Insert own (`pending`), read own | Full |
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

## Registration & payments (pending)

`/register` is in place. The form fields and workflow will be added once the organisers confirm them
(`src/features/registration`). The Razorpay flow is planned in `src/features/payments/types.ts`, with
`payment_transactions` and `payment_webhook_events` tables already secured. No payment processing is active.

## Deployment (Vercel)

Import the repo, set the two `VITE_SUPABASE_*` environment variables, and deploy. `vercel.json` handles
SPA routing.
