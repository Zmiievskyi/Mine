# Repository Guidelines

## Project Structure & Module Organization
- `frontend/` — Angular 21 + Tailwind; routes in `src/app/app.routes.ts`; core services/guards in `src/app/core`; features in `src/app/features` (auth, nodes, requests, dashboard, admin); shared UI in `src/app/shared`.
- `backend/` — NestJS 11; shared helpers in `src/common`, config in `src/config`, modules under `src/modules` (auth, users, nodes, requests, admin, health); Swagger at `/api/docs`.
- `docs/` holds product/API notes; `seed-admins.sh` seeds admins into Dockerized Postgres (`minegnk-postgres`); Compose files provision the local DB.

## Build, Test, and Development Commands
- DB: `docker-compose up -d` (Postgres on `localhost:5432`, `minegnk` user/password).
- Frontend: `cd frontend && npm install`; `npm start` for dev at `http://localhost:4200`; `npm run build` for prod bundle; `npm test` (Vitest via Angular CLI).
- Backend: `cd backend && npm install`; `npm run start:dev` with hot reload; `npm run start:prod` after `npm run build`; `npm test` (Jest) or `npm run test:cov` for coverage; migrations via `npm run migration:run` / `migration:show`.

## Coding Style & Naming Conventions
- TypeScript with 2-space indentation and single quotes; frontend Prettier uses `printWidth: 100`; backend uses ESLint + Prettier (`eslint.config.mjs`).
- Feature-first structure in Angular; components/services in PascalCase files, route segments in kebab-case. Backend classes are PascalCase with kebab-case file names.
- Format before pushing: backend `npm run format && npm run lint`; frontend relies on editor Prettier (no repo lint script yet).

## Testing Guidelines
- Backend specs use `.spec.ts` and Jest; run `npm test` for quick checks and `npm run test:cov` before PRs.
- Frontend specs live alongside components (e.g., `app.spec.ts`); run `npm test`.
- For data-touching changes, run against a seeded DB; `seed-admins.sh` can bootstrap admin accounts (change the default password immediately).

## Commit & Pull Request Guidelines
- Follow Conventional Commits used in history (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`). Example: `refactor: extract OAuth buttons to shared components`.
- PRs should include a concise summary, validation steps (commands + URLs), linked issue/ticket, screenshots or GIFs for UI work, and notes on migrations or env vars.
- Update Swagger and `backend/.env.example` in the same PR when APIs or configuration keys change.

## Security & Configuration Tips
- Copy `backend/.env.example` to `backend/.env`; do not commit secrets. Set `JWT_SECRET` to 32+ chars and keep OAuth credentials local.
- Keep CORS origins aligned with frontend hosts and adjust `app.bodyLimit` if payload sizes change.
- Rotate any default credentials created by `seed-admins.sh` and avoid production keys in local Compose files.
