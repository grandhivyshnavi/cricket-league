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
