# AGENTS.md

Guidance for AI agents working in this repository. Human-facing product/spec docs live in `README.md` — read it for feature detail.

## Project

BloodLink — real-time blood availability and donor network (hackathon project, problem HT-04 / HealthTech). Hospitals raise multi-group emergency requests, a matching engine ranks eligible donors (distance → reliability → eligibility freshness), donors respond on a live map, and an HMAC-signed QR handshake verifies arrival. Spec: `README.md` (features §1–3, architecture §4, data model §5, API §6, roadmap §9).

## Stack & layout

- Turborepo monorepo, **Bun** 1.3.x package manager, Node >= 24, TypeScript 7, Prettier.
- Workspaces: `apps/*`, `packages/*`.

```
apps/backend/            Express 5 + Bun API server (src/: app, routes, services, middleware)
packages/db/             Prisma 7 schema, migrations, client
packages/eslint-config/  shared ESLint config (no lint scripts wired up yet)
packages/typescript-config/ shared tsconfig (strict, noUncheckedIndexedAccess)
docker-compose.yaml      Postgres 15.3 service `db` / container `bloodlink-db`
```

- Database: PostgreSQL 15 (PostGIS planned for radius queries — see note at the bottom of `packages/db/prisma/schema.prisma`).
- Realtime/state plan: Socket.IO + Redis; push via FCM/Twilio; maps via Leaflet (see `README.md` §8).

## Commands

Run from the repo root:

| Command               | Purpose                                                        |
| --------------------- | -------------------------------------------------------------- |
| `bun install`         | install dependencies                                           |
| `bun run dev`         | start all workspaces (turbo `dev`)                             |
| `bun run build`       | build all workspaces                                           |
| `bun run lint`        | lint (currently a no-op: no workspace defines a `lint` script) |
| `bun run check-types` | typecheck (runs `backend:check-types` → `tsc --noEmit`)        |
| `bun run format`      | Prettier write on `**/*.{ts,tsx,md}`                           |

Database (run inside `packages/db` — these scripts do not exist at the root):

| Command               | Purpose                                                      |
| --------------------- | ------------------------------------------------------------ |
| `bun run db:generate` | regenerate the Prisma client                                 |
| `bun run db:migrate`  | `prisma migrate dev`                                         |
| `bun run db:deploy`   | `prisma migrate deploy`                                      |
| `bun run db:seed`     | reset + recreate the fixture dataset (see “Seed data” below) |

Backend only (run inside `apps/backend`):

| Command       | Purpose                                       |
| ------------- | --------------------------------------------- |
| `bun run dev` | start the API (`bun run index.ts`, port 3000) |

```bash
bunx tsc --noEmit -p apps/backend/tsconfig.json   # equivalent to bun run check-types
```

## Database setup

1. `docker compose up -d` → Postgres on `localhost:5432`, user/password/db all `bloodlink` (overridable via `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
2. `DATABASE_URL` lives in `packages/db/.env` (gitignored):
   `postgresql://bloodlink:bloodlink@localhost:5432/bloodlink`
3. `turbo.json` declares `DATABASE_URL` in `globalEnv`.
4. Prisma reads env via `env("DATABASE_URL")` in `packages/db/prisma7.config.ts`, which imports `dotenv/config` to load `packages/db/.env`.
5. Port 5432 must be free for `bloodlink-db` to publish it — another compose project (e.g. `mynodeapp_postgres`) can steal it, after which Prisma fails with `P1000: Authentication failed`. Check `docker ps` before debugging credentials.

Never commit `.env` files or real credentials. Synthetic/test data only (README §10).

## Auth (implemented)

- Runtime env (`apps/backend/.env`, gitignored — copy `.env.example`): `JWT_SECRET` (required, ≥16 chars), `JWT_EXPIRES_IN` (default `24h`), `PORT` (default `3000`), optional `DATABASE_URL` override that falls back to `packages/db/.env`.
- Endpoints (`apps/backend/src/routes/auth.ts`):
  - `POST /auth/register` — `{ role: "DONOR" | "HOSPITAL" | "BANK" | "ADMIN", phone, password, profile }` → 201 `{ token, user }`. Profile per role: donor `{ name, bloodGroup, dateOfBirth?, weightKg? }`; hospital `{ name, address, latitude, longitude, contact, documentUrl }` (also creates `HospitalVerification` with status `PENDING`); bank `{ name, address, latitude, longitude, contact }`. `ADMIN` → 403 `ADMIN_NOT_SELF_SERVE`; duplicate phone → 409 `PHONE_TAKEN`.
  - `POST /auth/login` — `{ phone, password }` → 200 `{ token, user }`; unknown phone and wrong password both return 401 `INVALID_CREDENTIALS`.
  - `GET /auth/me` — Bearer token → 200 `{ user }`.
- JWT: HS256 with `sub` = user id plus `phone`/`role` claims; sign/verify in `src/lib/jwt.ts`, guards in `src/middleware/auth.ts` (`requireAuth`, `requireRole(...)`).
- Errors use the envelope `{ error: { code, message } }` from `src/middleware/error.ts`.
- Passwords: bcryptjs (10 rounds), never serialized back (see `src/users.ts`).
- **No request payload validation** (deliberate project decision): `req.body` is passed straight to the service; input shapes are typed only (`RegisterInput` / `LoginInput` in `src/services/auth.ts`). Malformed payloads surface as 500s.

## Seed data

`bun run db:seed` (inside `packages/db`) clears its own fixture rows and recreates them — idempotent, safe to re-run. All accounts share the password `Test@1234`.

| Phone           | Role     | Detail                                                        |
| --------------- | -------- | ------------------------------------------------------------- |
| `+919800000001` | DONOR    | Asha Rao, O_POS, 12.9716/77.639 — shared location, score 100  |
| `+919800000002` | DONOR    | Ravi Kumar, A_POS, 12.9716/77.639 — same spot, score 82       |
| `+919800000003` | DONOR    | Meera Iyer, B_NEG, 12.9352/77.6245 — different spot, score 95 |
| `+919810000001` | HOSPITAL | City Care Hospital, Indiranagar — VERIFIED                    |
| `+919810000002` | HOSPITAL | Sunrise Multispeciality, Koramangala — VERIFIED               |
| `+919810000003` | HOSPITAL | Lakeview Hospital, Jayanagar — VERIFIED                       |
| `+919820000001` | BANK     | Red Cross Blood Centre, Kasturba Rd                           |
| `+919820000002` | BANK     | Rotary Blood Bank, Jayanagar                                  |
| `+919820000003` | BANK     | HSR Blood Care, HSR Layout                                    |

Donors are seeded `isOnline: true` with coordinates set; hospitals get `HospitalVerification` = `VERIFIED` (so they can raise requests immediately).

## Conventions

- ESM everywhere (`"type": "module"`), Bun runtime, `verbatimModuleSyntax`, `noEmit`.
- Prisma schema (`packages/db/prisma/schema.prisma`):
  - Models PascalCase, fields camelCase, tables mapped with `@@map("snake_case")`.
  - `id String @id @default(cuid())` on every model; `createdAt` / `updatedAt` always present.
  - Enums PascalCase name, SCREAMING_SNAKE values (`A_POS`, `WHOLE_BLOOD`, `CRITICAL`).
  - Enums already cover roles, blood groups, components, urgency, request/response status — extend them instead of adding string fields.
  - Multi-group requests are modeled as `RequestItem` rows per blood group + component; fulfillment is tracked per item (`unitsNeeded` / `unitsFulfilled`), never just per request.
  - Relations are explicit with `fields`/`references`; keep the schema referentially complete before migrating.
- After any schema change: `bun run db:migrate`, then `bun run db:generate`.
- API surface and module breakdown to follow: `README.md` §6 (Auth, Bank Inventory, Search, Donor, Request, Matching, Notification, QR, Trust, Realtime, Admin).

## Feature invariants (do not break)

- **QR handshake**: token = `{donor_id, request_id, issued_at, expires_at, nonce}`, HMAC-SHA256 signed, ~15 min TTL, single use (`QRToken.used`); verification order = signature → expiry → not used → donor/request match. On success: `arrived`, decrement `units_needed`, set `lastDonationDate` (cooldown), bump reliability.
- **Matching engine**: exact group first, then ABO/Rh-compatible substitutes; rank `distance asc → reliability score desc → eligibility freshness asc`; notify in waves, not all at once.
- **Hospital gating**: only `verified` hospitals (via `HospitalVerification`) may raise requests.
- **Donor privacy**: location pings only while the "Available Now" toggle is on, fuzzed ~250 m until acceptance, visible only to the requesting hospital.
- **Reliability**: QR-confirmed arrival raises score; accepted-but-never-arrived (cron window) lowers it and feeds matching priority.

## Workflow

1. Read `README.md` for intent, this file for mechanics.
2. Match existing patterns; prefer extending Prisma enums/models over ad-hoc fields.
3. Small, focused changes. No comments unless asked. Never commit unless explicitly asked.
4. Before finishing: `bun run format`, `bun run check-types`, and `docker compose config` if compose files changed.
