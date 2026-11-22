# AGENTS.md

## Commands
- Dev: `npm run dev` (port 5173)
- Verify: `npm run typecheck && npm test && npm run build`
- npm behind the corporate proxy needs the Windows cert store: run with `NODE_OPTIONS=--use-system-ca`.
- Install deps with `npm install --before=<date ≥7 days ago>` to avoid freshly published versions.

## Conventions
- Official name: "Sankranthi Super Cricket League 2027" — use `TOURNAMENT` from `src/config/site.ts`.
- All data access goes through `src/data` (`TournamentRepository`); UI uses `useTournament()` / `useAuth()`.
- Security lives in Postgres RLS (`supabase/migrations`). Never rely on hiding UI for permissions.
- Do not invent scoring/business rules — standings are admin-entered.
- Times are entered and displayed in IST (`src/lib/datetime.ts`).
- Design tokens are in `src/index.css` (`@theme`): ink/volt/fog colours, `rounded-card|panel|control`,
  `font-heading`, `font-poster`, `font-accent`, `surface`, `glass`.
- Lucide v1 icon names differ from older versions (e.g. `Trash`, `CircleCheck`, `CircleExclamationPoint`).
- Fonts are self-hosted via @fontsource (Archivo needs the `standard.css` build for the width axis).
- Registration: form in `src/features/registration`, data access in `src/data/registrations.ts`. Public submissions
  go only through the `submit_team_registration` / `complete_team_registration_photo` / `discard_team_registration`
  RPCs; keep client validation (`validation.ts`) in sync with the SQL checks in the migration.
- Duplicate-prevention rules (enforced in the SQL RPC, plus client-side duplicate-player detection):
  * Team name must be unique across active (pending/approved) registrations.
  * Team email must be unique across active registrations.
  * Team contact phone must be unique across active registrations.
  * Player identity (`normalized_name`, `normalized_phone`) must be unique across active registrations.
  * Same phone with different player names is allowed; same name with different phones is allowed.
  * Address fields are not part of uniqueness — multiple teams may share the same address.
- Shell: `rg` and `python` are not installed; use `grep`. Reach Supabase from Node with `NODE_OPTIONS=--use-system-ca`
  (curl fails on the proxy certificate). No Supabase CLI here — migrations are applied in the dashboard SQL editor.
