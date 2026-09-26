# AGENTS.md

Guidance for AI agents working in this repository. Human-facing product/spec docs live in `README.md` — read it for feature detail.

## Project

BloodLink — real-time blood availability and donor network (hackathon project, problem HT-04 / HealthTech). Hospitals raise multi-group emergency requests, a matching engine ranks eligible donors (distance → reliability → eligibility freshness), donors respond on a live map, and an HMAC-signed QR handshake verifies arrival. Spec: `README.md` (features §1–3, architecture §4, data model §5, API §6, roadmap §9).

## Stack & layout

- Turborepo monorepo, **Bun** 1.3.x package manager, Node >= 24, TypeScript 7, Prettier.
- Workspaces: `apps/*`, `packages/*`.

```
apps/backend/            Express 5 + Bun API server (index.ts + src/: app, routes, services, jobs, middleware)
packages/db/             Prisma 7 schema, migrations, client
packages/eslint-config/  shared ESLint config (no lint scripts wired up yet)
packages/typescript-config/ shared tsconfig (strict, noUncheckedIndexedAccess)
docker-compose.yaml      Postgres 15.3 service `db` / container `bloodlink-db`
```

- Database: PostgreSQL 15 (PostGIS planned for radius queries — see note at the bottom of `packages/db/prisma/schema.prisma`).
- Realtime: Socket.IO in-process (`src/lib/socket.ts`, rooms `request:{id}`); no Redis yet. Donor alerts go out over **whatsapp-web.js** (`src/services/whatsapp.ts`, console fallback when not linked) — not FCM/Twilio.
- Frontend: **demo only** — `apps/backend/public/` (vanilla JS SPA served by `express.static`: `index.html` / `app.js` / `styles.css`) covers all four roles plus a public **Explore** tab (bank search + live overview map, no sign-in). It is the manual test surface: after API changes, smoke-test against `http://localhost:3000`. The real `apps/frontend` (Vite + React + Tailwind) is **not built yet** but fully specified in `FRONTEND.md` (routes, wireframes, states, build order); screens marked `[TBD-endpoint]` there need backend work first.

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

- Runtime env (`apps/backend/.env`, gitignored — copy `.env.example`): `JWT_SECRET` (required, ≥16 chars), `QR_SECRET` (required, ≥16 chars — HMAC key for QR tokens and donor response links), `JWT_EXPIRES_IN` (default `24h`), `PORT` (default `3000`), optional `DATABASE_URL` override that falls back to `packages/db/.env`, plus flow tuning vars listed under “Emergency request flow” below.
- Endpoints (`apps/backend/src/routes/auth.ts`):
  - `POST /auth/register` — `{ role: "DONOR" | "HOSPITAL" | "BANK" | "ADMIN", phone, password, profile }` → 201 `{ token, user }`. Profile per role: donor `{ name, bloodGroup, dateOfBirth?, weightKg?, latitude?, longitude?, lastDonationDate? }` (location is stored as the donor's home coordinates without a ping; a `lastDonationDate` inside the 84-day cooldown registers the donor as `eligible: false`); hospital `{ name, address, latitude, longitude, contact, documentUrl }` (also creates `HospitalVerification` with status `PENDING`); bank `{ name, address, latitude, longitude, contact }`. `ADMIN` → 403 `ADMIN_NOT_SELF_SERVE`; duplicate phone → 409 `PHONE_TAKEN`.
  - `POST /auth/login` — `{ phone, password }` → 200 `{ token, user }`; unknown phone and wrong password both return 401 `INVALID_CREDENTIALS`.
  - `GET /auth/me` — Bearer token → 200 `{ user }`.
- JWT: HS256 with `sub` = user id plus `phone`/`role` claims; sign/verify in `src/lib/jwt.ts`, guards in `src/middleware/auth.ts` (`requireAuth`, `requireRole(...)`).
- Errors use the envelope `{ error: { code, message } }` from `src/middleware/error.ts`.
- Passwords: bcryptjs (10 rounds), never serialized back (see `src/users.ts`).
- **Payload validation** is hand-rolled per endpoint (no zod): enum/shape checks live in the route or service using the guards in `src/utils/enums.ts` (`isBloodGroup`, `isComponent`, `isUrgency`, `isValidCoordinates`) plus explicit numeric-range checks, and failures throw `HttpError` (400/409). Unvalidated paths can still surface as 500s.

## Emergency request flow (implemented)

Blueprint: `IMPLEMENTATION.md` (file map uses the old `bloodlink-backend/*.js` naming — the real code is the TypeScript under `apps/backend/src/`).

- **Hospital** (`src/routes/hospital.routes.ts`, role `HOSPITAL`):
  - `POST /hospital/request` — `{ items: [{ bloodGroup|blood_group, units|unitsNeeded, component? }], radiusKm|radius_km, urgency }` → 201; creates `EmergencyRequest` + `RequestItem` rows, then fires `matchingEngine.dispatch()` (non-blocking). 403 `HOSPITAL_NOT_VERIFIED` unless `HospitalVerification.status === VERIFIED`.
  - `GET /hospital/request/:id` — request + items + responses (own hospital only, else 404).
  - `POST /hospital/request/:id/verify-arrival` — `{ token }`: `qrService.verify()` (signature → expiry → DB → unused) inside a transaction that locks `request_items` (`FOR UPDATE`), flips `QRToken.used`, sets `ARRIVED`, increments `unitsFulfilled` (exact group first, any unfilled item otherwise), sets `lastDonationDate`, reliability `+10`/`completedCount +1`, then `syncRequestStatus()` → `MATCHED`/`FULFILLED`. Replay → 409 `TOKEN_ALREADY_USED`.
  - `POST /hospital/request/:id/close` — `OPEN`/`MATCHED` → `CLOSED` (expires outstanding `NOTIFIED`/`VIEWED` responses, clears the fallback timer); 409 `REQUEST_ALREADY_CLOSED` if already `CLOSED`/`FULFILLED`.
  - `POST /hospital/request/:id/complete` — force `OPEN`/`MATCHED` → `FULFILLED`.
- **Donor** (`src/routes/donor.routes.ts`, role `DONOR`): `PATCH /donor/availability` `{status: online|offline}`, `POST /donor/location` `{lat,lng}` (409 `DONOR_OFFLINE` while offline; refreshes `lastPingAt`), `POST /donor/request/:id/respond` `{action: accept|decline}` → returns `{status, accepted, qr}` (QR generated on accept), `GET /donor/request/:id/qr-token` → `{token, qrDataUrl, expiresAt}`. Accept path (`src/services/responseService.ts`) locks `request_items`, recounts `ACCEPTED`+`ARRIVED` vs total `unitsNeeded` → 409 `ALREADY_FULFILLED` on overbook.
- **Public response links** (`src/routes/respond.ts`): `GET /donor/respond/:token?action=accept|deny` — stateless HMAC link from the WhatsApp message, returns HTML (QR data-URL on accept). No login.
- **Bank** (`src/routes/bank.routes.ts`, role `BANK`): `POST /bank/inventory` (upsert on `bankId+bloodGroup+component`), `GET /bank/inventory[?blood_group=]`.
- **Admin** (`src/routes/admin.routes.ts`, role `ADMIN`): `GET /admin/hospitals/pending`, `POST /admin/hospitals/:id/verify` `{status: VERIFIED|REJECTED}`.
- **Matching** (`src/services/matchingEngine.ts`): exact-group wave capped at `WAVE_SIZE`, then a substitute wave after `WAVE_FALLBACK_DELAY_MINUTES` using `compatibleDonorGroups()` (`src/utils/compatibility.ts`, recipient→donor ABO/Rh matrix). Candidates (`src/utils/geo.ts`) must be `eligible && isOnline` with `lastPingAt` fresher than `STALE_PING_SECONDS`.
- **Status tracking** (`src/services/requestService.ts`): `syncRequestStatus()` recomputes `OPEN → MATCHED → FULFILLED` from `unitsFulfilled` + `ACCEPTED`/`ARRIVED` responses and emits `request_status_update`; it runs after every accept/decline (so a request flips to `MATCHED` on first acceptance, and back to `OPEN` if every acceptor declines) and after verify-arrival. Matching (`dispatch`, fallback wave, late-match, recovery cron) keeps running while a request is `MATCHED` as long as `ACCEPTED`+`ARRIVED` < total `unitsNeeded`.
- **Public reads** (no auth): `GET /search?blood_group=&component?=&lat=&lng?=&radius_km?=&in_stock?` → nearest banks with stock + contact (`src/routes/search.routes.ts` + `src/services/searchService.ts`), `GET /map/overview` → banks (with non-zero stock) + `OPEN`/`MATCHED` requests from the last 24 h (`src/routes/map.routes.ts`).
- **Realtime** (`src/lib/socket.ts`): events `donor_location_update`, `request_status_update` to room `request:{id}`; client joins with `join_request_room`.
- **Jobs** (`src/jobs/`, started from `index.ts`): no-show sweep every 10 min (`ACCEPTED` older than `NO_SHOW_GRACE_MINUTES` → `NO_SHOW`, reliability `-10`/`noShowCount +1`, score 90 if absent) and stale-ping sweep every minute (drops `isOnline` when `lastPingAt` is older than `STALE_PING_SECONDS`).
- **Env tuning**: `WAVE_FALLBACK_DELAY_MINUTES` (5), `WAVE_SIZE` (10), `NO_SHOW_GRACE_MINUTES` (120), `STALE_PING_SECONDS` (90), `ACTION_LINK_TTL_MINUTES` (720), `PUBLIC_BASE_URL` (link base), `WHATSAPP_ENABLED` (default true).
- **Not built yet**: Redis-backed scaling, donor frontend / hospital scanner UI, location fuzzing, expiry batches, rewards/certificates, demand forecasting.

## Seed data

`bun run db:seed` (inside `packages/db`) clears its own fixture rows (including `Inventory`, `RequestItem`, `QRToken`…) and recreates them — idempotent, safe to re-run. All accounts share the password `Test@1234`. It also seeds 72 `Inventory` rows (8 groups × 3 components × 3 banks, some zero-stock) and ~140 `EmergencyRequest` rows spread over the previous 90 days (`FULFILLED`/`CLOSED` only) so `/search`, `/map/overview` and future demand reporting have data.

| Phone           | Role     | Detail                                                        |
| --------------- | -------- | ------------------------------------------------------------- |
| `+919800000001` | DONOR    | Asha Rao, O_POS, 12.9716/77.639 — shared location, score 100  |
| `+919800000002` | DONOR    | Ravi Kumar, A_POS, 12.9716/77.639 — same spot, score 82       |
| `+919800000003` | DONOR    | Meera Iyer, B_NEG, 12.9352/77.6245 — different spot, score 95 |
| `+919800000004` | DONOR    | Kiran Shetty, O_NEG, 12.9809/77.6412 — ~1 km from City Care   |
| `+919800000005` | DONOR    | Farhan Ali, A_NEG, 12.9/77.75 — ~14 km out (outside 5 km)     |
| `+919810000001` | HOSPITAL | City Care Hospital, Indiranagar — VERIFIED                    |
| `+919810000002` | HOSPITAL | Sunrise Multispeciality, Koramangala — VERIFIED               |
| `+919810000003` | HOSPITAL | Lakeview Hospital, Jayanagar — VERIFIED                       |
| `+919820000001` | BANK     | Red Cross Blood Centre, Kasturba Rd                           |
| `+919820000002` | BANK     | Rotary Blood Bank, Jayanagar                                  |
| `+919820000003` | BANK     | HSR Blood Care, HSR Layout                                    |
| `+919890000000` | ADMIN    | BloodLink Admin (needed for the hospital-verify flow)         |

Donors are seeded `isOnline: true` with coordinates and a fresh `lastPingAt`; hospitals get `HospitalVerification` = `VERIFIED` (so they can raise requests immediately).

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

- **QR handshake**: token = `{donor_id, request_id, issued_at, expires_at, nonce}`, HMAC-SHA256 signed, ~15 min TTL, single use (`QRToken.used`); verification order = signature → expiry → not used → donor/request match. On success: `arrived`, increment `unitsFulfilled` on a `RequestItem`, set `lastDonationDate` (cooldown), bump reliability.
- **Matching engine**: exact group first, then ABO/Rh-compatible substitutes; rank `distance asc → reliability score desc → eligibility freshness asc`; notify in waves, not all at once.
- **Hospital gating**: only `verified` hospitals (via `HospitalVerification`) may raise requests.
- **Donor privacy**: location pings only while the "Available Now" toggle is on, fuzzed ~250 m until acceptance, visible only to the requesting hospital.
- **Reliability**: QR-confirmed arrival raises score; accepted-but-never-arrived (cron window) lowers it and feeds matching priority.

## Workflow

1. Read `README.md` for intent, this file for mechanics, `FRONTEND.md` for the frontend screen/UI blueprint (routes, wireframes, placeholders).
2. Match existing patterns; prefer extending Prisma enums/models over ad-hoc fields.
3. Small, focused changes. No comments unless asked. Never commit unless explicitly asked.
4. Before finishing: `bunx prettier --write <changed files>` (root `bun run format` also rewrites the currently non-clean `README.md`), `bun run check-types`, and `docker compose config` if compose files changed.
