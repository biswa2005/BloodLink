# FRONTEND.md — BloodLink Web App (screen-by-screen spec)

**Status:** the LifeDrop Vite app is integrated at `apps/frontend`; this file remains the build blueprint for completing the client side.

| Doc                      | Contents                                    |
| ------------------------ | ------------------------------------------- |
| `README.md`              | Product intent, features, architecture      |
| `AGENTS.md`              | Repo mechanics, backend behavior, seed data |
| `FRONTEND.md` (this one) | Routes, wireframes, states, build order     |

Backend facts (endpoints, enums, socket events, seed accounts) below are quoted from the **implemented** code, not from the wish-list in `README.md` §6. Where a screen needs an endpoint that does not exist yet it is marked **`[TBD-endpoint]`**; where UI copy is filler it is marked **`[TBD]`**.

---

## Table of contents

1. [Overview & stack](#1-overview--stack)
2. [App shell & shared UI kit](#2-app-shell--shared-ui-kit)
3. [UI map — global](#3-ui-map--global)
4. [Donor — 7 screens](#4-donor--7-screens)
5. [Blood Bank — 5 screens](#5-blood-bank--5-screens)
6. [Hospital — 7 screens](#6-hospital--7-screens)
7. [Admin — 6 screens](#7-admin--6-screens)
8. [Realtime & state wiring](#8-realtime--state-wiring)
9. [Build order](#9-build-order)

---

## 1. Overview & stack

One **Vite + React + TypeScript + Tailwind CSS** SPA in `apps/frontend` containing all four role areas. No separate mobile build, no app-store step — a donor, a hospital receptionist, a bank clerk, and an admin all open the same deploy.

### Libraries

| Library                     | Purpose                                                          |
| --------------------------- | ---------------------------------------------------------------- |
| `react-router` v7           | Routing, role guards, nested layouts                             |
| `@tanstack/react-query`     | API calls, caching, loading/error states, invalidation           |
| `socket.io-client`          | Live map + request status stream (same server as REST)           |
| `react-leaflet` + `leaflet` | Hospital live map (OpenStreetMap, free, no API key)              |
| `html5-qrcode`              | Camera scanner on the hospital reception page                    |
| `qrcode`                    | Renders the donor's QR as a data-URL (`QRCode.toDataURL`)        |
| `recharts`                  | Admin dashboard charts                                           |
| `zustand`                   | Tiny client store: auth token, session user, availability toggle |

Deliberately **not** used: Redux, Next.js, a component library (Tailwind + our own kit in §2), Axios (plain `fetch` wrapper).

### Proposed layout

```
apps/frontend/
├── index.html
├── vite.config.ts            # proxy: /auth /donor /hospital /bank /admin /health /socket.io → :3000
├── tailwind.config.ts
├── public/
│   └── placeholders/         # avatar.svg, doc.svg, banner.svg (see §2.4)
└── src/
    ├── main.tsx
    ├── App.tsx               # router + providers (Query, Auth, Socket, Toast)
    ├── routes/
    │   ├── auth/             #   login.tsx, register.tsx
    │   ├── donor/            #   home, alert, request, qr, history, profile
    │   ├── bank/             #   dashboard, inventory, activity, supplied, profile
    │   ├── hospital/         #   home, new-request, request, map, scan, history, profile
    │   └── admin/            #   dashboard, verifications, hospitals, donors, requests, settings
    ├── components/
    │   ├── ui/               #   the shared kit from §2.2
    │   ├── shell/            #   AppShell, Sidebar, Topbar, RoleGate
    │   └── map/              #   LiveMap, HospitalMarker, DonorDot, Legend, Popover
    ├── hooks/
    │   ├── useGeolocation.ts #   watchPosition + permission state machine
    │   ├── useAvailability.ts#   toggle → ping loop (see §8.2)
    │   ├── useSocket.ts      #   connection + room join/leave
    │   ├── useCountdown.ts   #   QR expiry ticker
    │   └── useOnline.ts      #   navigator.onLine + OfflineBanner
    ├── lib/
    │   ├── api.ts            #   fetch wrapper, bearer token, error-envelope mapping
    │   ├── socket.ts         #   singleton io() instance
    │   └── format.ts         #   dates, km, blood-group labels (O_POS → "O+")
    ├── mock/                 #   static data for screens whose endpoints are [TBD-endpoint]
    │   ├── donors.ts         #   seeded donors +919800000001…5
    │   ├── inventory.ts
    │   ├── adminStats.ts
    │   └── activity.ts
    └── styles/globals.css
```

### API client conventions (`lib/api.ts`)

- Base URL: same origin (Vite dev proxy → `http://localhost:3000`).
- Token: `localStorage.authToken`, sent as `Authorization: Bearer <jwt>`; 401 → clear token, redirect `/login?reason=expired`.
- Errors: backend envelope `{ error: { code, message } }` is unwrapped — `api.get()` throws `ApiError { code, message, status }`; screens render `ErrorState` with `message`, mutations surface a toast with `code` in dev.
- Mutations invalidate the relevant React Query keys (`['inventory']`, `['hospital','requests']`, …).

---

## 2. App shell & shared UI kit

### 2.1 App shell

Every authenticated route renders inside `<AppShell>`: fixed left sidebar (brand + role nav + "signed in as" block), top bar (page title, connection dot, offline banner slot, avatar menu → profile/logout), scrollable content area. Auth routes (`/login`, `/register`) render bare, no shell.

```
┌──────────────┬──────────────────────────────────────────────────┐
│ ● BloodLink  │  Page title                     ● live  ⚙  (A) │  ← topbar
├──────────────┼──────────────────────────────────────────────────┤
│ Donor        │                                                  │
│  • Home      │              <main>                              │
│  • History   │                                                  │
│  • Profile   │                                                  │
│ ───────────  │                                                  │
│ (B) Asha Rao │                                                  │
│ O+ · score 100                                                  │
└──────────────┴──────────────────────────────────────────────────┘
```

- Sidebar items differ per role (`RoleGate` redirects `/donor/*` → `/login` when the JWT role mismatches; route-level, not just hidden links).
- Connection dot: green = socket connected, amber = polling fallback, red = offline.

### 2.2 Shared UI kit (`components/ui/`)

| Component                                 | Notes                                                              |
| ----------------------------------------- | ------------------------------------------------------------------ |
| `Button`                                  | `variant: primary/ghost/danger/success`, `loading` spinner state   |
| `Input`, `Select`, `Textarea`, `Checkbox` | label + error slot; error shows backend `message`                  |
| `Card`                                    | padded surface w/ optional header/footer                           |
| `BloodGroupChip`                          | `group: A_POS` → `A+` pill, colored per §2.3 palette               |
| `UrgencyPill`                             | `LOW/MEDIUM/HIGH/CRITICAL`                                         |
| `StatusPill`                              | request status + response status (same vocabulary as Prisma enums) |
| `ProgressBar`                             | `fulfilled/needed`, also used for per-item request progress        |
| `Skeleton`                                | 3 shapes: line, block, card — used by every list/detail screen     |
| `EmptyState`                              | icon + title + hint + optional CTA ("No requests yet")             |
| `ErrorState`                              | message + `Retry` button; reads `ApiError.message`                 |
| `OfflineBanner`                           | sticky amber bar when `navigator.onLine === false`                 |
| `Toast`                                   | success/error/Info; one at a time, 4 s                             |
| `Modal`                                   | centered, `Esc`/backdrop close; used for add/edit + review dialogs |
| `ConfirmDialog`                           | for destructive actions (reject hospital, discard form)            |
| `Table`                                   | sortable-ish static table w/ sticky header (admin + history lists) |
| `Tabs`                                    | profile pages (Profile / Security)                                 |
| `CountdownBadge`                          | `mm:ss`, turns red under 2 min (QR screen)                         |

### 2.3 Color vocabulary (single source of truth, in `globals.css`)

**Blood groups** — used by chips, map dots, inventory cells, progress bars:

| Group          | O_NEG     | O_POS     | A_NEG     | A_POS     | B_NEG     | B_POS     | AB_NEG    | AB_POS    |
| -------------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- |
| Tailwind token | red       | rose      | orange    | amber     | lime      | yellow    | teal      | sky       |
| Dot hex        | `#dc2626` | `#f43f5e` | `#ea580c` | `#f59e0b` | `#84cc16` | `#eab308` | `#14b8a6` | `#0ea5e9` |

**Response status (map dots / legend):** `NOTIFIED` grey `#9ca3af` → `VIEWED` blue `#3b82f6` → `ACCEPTED` green `#22c55e` → `ARRIVED` gold ring `#eab308` → `DECLINED / EXPIRED / NO_SHOW` faded `#d1d5db` (40 % opacity).

**Request status:** `OPEN` blue · `MATCHED` green · `FULFILLED` teal · `CLOSED` grey.

**Urgency:** `LOW` slate · `MEDIUM` amber · `HIGH` orange · `CRITICAL` red + pulse animation.

### 2.4 Placeholder conventions

1. **Accounts** — every mock/login helper uses the seeded users from `AGENTS.md` (password `Test@1234`): donors `+919800000001…5`, hospitals `+919810000001…3`, banks `+919820000001…3`, admin `+919890000000`. Login screen shows a one-click "fill demo account" chip per role (dev only, behind `import.meta.env.DEV`).
2. **`[TBD-endpoint]`** — screen is built against `src/mock/*` behind a `useMock()` flag, with a small amber dev badge "mock data" in the corner. Flip the flag when the endpoint lands.
3. **`[TBD]`** — placeholder copy/text that product will finalize (e.g. notification wording, empty-state hints).
4. **Image slots** — `public/placeholders/{avatar,doc,org-logo}.svg`; every `<img>` takes `src ?? "/placeholders/avatar.svg"`. Never hotlink.
5. **Banner/marketing copy** — lorem allowed only inside `mock/` data or clearly-marked `[TBD]` strings, never as real product copy.

---

## 3. UI map — global

### 3.1 Sitemap

```
BloodLink SPA
├── /login ................................ public
├── /register ............................. public
│
├── DONOR
│   ├── /donor ................................ Home (Available Now toggle)
│   ├── /donor/alert/:requestId .............. Incoming-request full-screen alert
│   ├── /donor/request/:requestId ............ Request detail (accept / decline)
│   ├── /donor/qr/:requestId ................. QR display + expiry countdown
│   ├── /donor/history ....................... History + reliability stats
│   └── /donor/profile ........................ Profile
│
├── BANK
│   ├── /bank ................................ Dashboard + low-stock alerts
│   ├── /bank/inventory ...................... Group × component matrix + add/edit
│   ├── /bank/activity ....................... Stock activity log
│   ├── /bank/requests ....................... Requests we supplied to
│   └── /bank/profile ........................ Profile
│
├── HOSPITAL
│   ├── /hospital ............................ Dashboard / request history
│   ├── /hospital/new ........................ Raise multi-group request
│   ├── /hospital/request/:requestId ......... Request detail (per-item progress)
│   ├── /hospital/request/:requestId/map ..... Live map (Rapido-style)
│   ├── /hospital/scan ........................ QR scanner (camera)
│   ├── /hospital/history .................... History table
│   └── /hospital/profile .................... Profile (+ verification status)
│
└── ADMIN
    ├── /admin ............................... Dashboard stats (recharts)
    ├── /admin/verifications ................. Pending-verification queue + review
    ├── /admin/hospitals ..................... All hospitals
    ├── /admin/donors ........................ Reliability leaderboard
    ├── /admin/requests ...................... All requests
    └── /admin/settings ...................... Settings
```

26 routes total. The verification-pending **banner** is not a route — it is rendered by the hospital `AppShell` whenever `user.hospital.verificationStatus !== "VERIFIED"` (§6.1).

### 3.2 Route → role → API → socket table

| Path                        | Role     | Screen (§) | API (implemented)                                                  | Socket                                                       |
| --------------------------- | -------- | ---------- | ------------------------------------------------------------------ | ------------------------------------------------------------ |
| `/login`                    | public   | 4.1        | `POST /auth/login`                                                 | —                                                            |
| `/register`                 | public   | 4.1        | `POST /auth/register`                                              | —                                                            |
| _(any)_                     | all      | 2.1        | `GET /auth/me` (on boot, validates token)                          | —                                                            |
| `/donor`                    | DONOR    | 4.2        | `PATCH /donor/availability`, `POST /donor/location`                | — (pings, not socket)                                        |
| `/donor/alert/:requestId`   | DONOR    | 4.3        | `GET /donor/requests` (find by id)                                 | join room → `request_status_update`                          |
| `/donor/request/:requestId` | DONOR    | 4.4        | `POST /donor/request/:id/respond`                                  | `request_status_update`                                      |
| `/donor/qr/:requestId`      | DONOR    | 4.5        | `GET /donor/request/:id/qr-token`                                  | `request_status_update`                                      |
| `/donor/history`            | DONOR    | 4.6        | `GET /donor/requests`                                              | —                                                            |
| `/donor/profile`            | DONOR    | 4.7        | `GET /auth/me`                                                     | —                                                            |
| `/bank`                     | BANK     | 5.1        | `GET /bank/inventory`                                              | —                                                            |
| `/bank/inventory`           | BANK     | 5.2        | `GET /bank/inventory`, `POST /bank/inventory`                      | —                                                            |
| `/bank/activity`            | BANK     | 5.3        | **`[TBD-endpoint]`** stock movement log                            | —                                                            |
| `/bank/requests`            | BANK     | 5.4        | **`[TBD-endpoint]`** requests supplied to                          | —                                                            |
| `/bank/profile`             | BANK     | 5.5        | `GET /auth/me`                                                     | —                                                            |
| `/hospital`                 | HOSPITAL | 6.6        | `GET /hospital/requests`                                           | —                                                            |
| `/hospital/new`             | HOSPITAL | 6.2        | `POST /hospital/request`                                           | — (dispatch is server-side)                                  |
| `/hospital/request/:id`     | HOSPITAL | 6.4        | `GET /hospital/request/:id`                                        | join room → both events                                      |
| `/hospital/request/:id/map` | HOSPITAL | 6.3        | `GET /hospital/request/:id`                                        | join room → `donor_location_update`, `request_status_update` |
| `/hospital/scan`            | HOSPITAL | 6.5        | `POST /hospital/request/:id/verify-arrival`                        | `request_status_update`                                      |
| `/hospital/history`         | HOSPITAL | 6.6        | `GET /hospital/requests`                                           | —                                                            |
| `/hospital/profile`         | HOSPITAL | 6.7        | `GET /auth/me` (→ `hospital.verificationStatus`)                   | —                                                            |
| `/admin`                    | ADMIN    | 7.1        | **`[TBD-endpoint]`** platform stats                                | —                                                            |
| `/admin/verifications`      | ADMIN    | 7.2        | `GET /admin/hospitals/pending`, `POST /admin/hospitals/:id/verify` | —                                                            |
| `/admin/hospitals`          | ADMIN    | 7.3        | **`[TBD-endpoint]`** all hospitals                                 | —                                                            |
| `/admin/donors`             | ADMIN    | 7.4        | **`[TBD-endpoint]`** leaderboard (mock: seed data)                 | —                                                            |
| `/admin/requests`           | ADMIN    | 7.5        | **`[TBD-endpoint]`** all requests                                  | —                                                            |
| `/admin/settings`           | ADMIN    | 7.6        | local (persisted to `localStorage`)                                | —                                                            |

Backend enum vocabulary used verbatim in pills/labels: `BloodGroup` (8), `Component` (`WHOLE_BLOOD|PLATELETS|PLASMA`), `Urgency` (`LOW|MEDIUM|HIGH|CRITICAL`), `RequestStatus` (`OPEN|MATCHED|FULFILLED|CLOSED`), `ResponseStatus` (`NOTIFIED|VIEWED|ACCEPTED|DECLINED|ARRIVED|NO_SHOW|EXPIRED`), `VerificationStatus` (`PENDING|VERIFIED|REJECTED`).

### 3.3 Input fields by user type (index)

Every form in the app, per role — full field specs live at the linked section.

| User type | Screen / form          | §       | Inputs (spec at)                                             |
| --------- | ---------------------- | ------- | ------------------------------------------------------------ |
| any       | Login                  | 4.1a    | phone, password                                              |
| DONOR     | Register               | 4.1b    | name, phone, password, blood group, DOB, weight, declaration |
| DONOR     | Home — availability    | 4.2     | toggle (no text inputs; permission primer first)             |
| DONOR     | Alert / detail respond | 4.3–4.4 | Accept / Decline buttons (no text inputs)                    |
| DONOR     | Profile + Security     | 4.7     | name, blood group, DOB, weight; current/new/confirm password |
| BANK      | Register               | 4.1d    | name, phone, password, address, lat, lng, contact            |
| BANK      | Inventory add/edit     | 5.2     | group, component, units                                      |
| BANK      | Profile + settings     | 5.5     | name, address, lat, lng, contact, low-stock threshold        |
| HOSPITAL  | Register               | 4.1c    | name, phone, password, address, lat, lng, contact, document  |
| HOSPITAL  | Raise request          | 6.2     | urgency, radius, item rows (group, component, units)         |
| HOSPITAL  | QR scanner             | 6.5     | request selector, manual token, image file                   |
| HOSPITAL  | Profile                | 6.7     | name, address, lat, lng, contact (+ read-only doc/status)    |
| ADMIN     | Register               | 4.1e    | none — self-serve disabled                                   |
| ADMIN     | Verification review    | 7.2     | reviewer note, Verify/Reject decision                        |
| ADMIN     | Settings               | 7.6     | read-only platform constants, acknowledgement checkbox       |

Shared input rules: labels above the field, `required` marked with `*`, errors under the field from the backend `{error:{code,message}}` envelope, `Input`/`Select`/`Textarea` from §2.2, numeric fields use `inputMode="decimal"` on mobile, phone fields are always `+91`-prefixed and normalized to E.164 before submit.

---

## 4. Donor — 7 screens

### 4.1 Screen D1 — Auth (login ⇄ register)

Route: `/login`, `/register` (public). One component, two modes.

```
        ┌─────────────────────────────┐
        │        ● BloodLink          │
        │   "Donate. Get found." [TBD]│
        │                            │
        │  ( Log in │ Register )     │  ← tab switch
        │  ┌───────────────────────┐  │
        │  │ +91  phone            │  │
        │  ├───────────────────────┤  │
        │  │ ••••••••  password     │  │
        │  └───────────────────────┘  │
        │  I am a: ( donor | hospital │ bank )   ← register only
        │  [      Log in / Register    ]         ← primary btn
        │  demo: (donor)(hospital)(bank)(admin)   ← DEV chips
        └─────────────────────────────┘
```

- **States:** loading → button spinner; error → inline under field mapping `PHONE_TAKEN`, `INVALID_CREDENTIALS`, `ADMIN_NOT_SELF_SERVE`; success → store token + `GET /auth/me`, redirect by role: DONOR `/donor`, HOSPITAL `/hospital`, BANK `/bank`, ADMIN `/admin`.
- Wired: `POST /auth/login`, `POST /auth/register`.
- Every form in §4–§7 carries a field table below in the standard format: **# · Field · Control · Required · Validation · Maps to / notes**.

#### 4.1a Login — fields (shared by both modes)

| #   | Field    | Control                                                   | Required | Validation / format                          | Notes                                                                                                                     |
| --- | -------- | --------------------------------------------------------- | -------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | Phone    | `Input type=tel`, fixed `+91` prefix, `inputMode=numeric` | yes      | exactly 10 digits after prefix; strip spaces | `autocomplete="username"`; seed example `9800000001`                                                                      |
| 2   | Password | `Input type=password` + show/hide eye                     | yes      | ≥ 8 chars on register; any on login          | `autocomplete="current-password"` (login) / `"new-password"` (register); wrong → inline error `INVALID_CREDENTIALS` (401) |
| 3   | Role     | segmented control (register mode only)                    | yes      | —                                            | donor / hospital / bank; admin tab DEV-only → info panel `ADMIN_NOT_SELF_SERVE`                                           |

#### 4.1b Register — role: DONOR

Payload: `POST /auth/register { role:"DONOR", phone, password, profile:{…} }`

| #   | Field         | Control                                               | Required | Validation / format                                      | Maps to                                         |
| --- | ------------- | ----------------------------------------------------- | -------- | -------------------------------------------------------- | ----------------------------------------------- |
| 1   | Full name     | `Input text`                                          | yes      | 2–60 chars, trimmed                                      | `profile.name`                                  |
| 2   | Phone         | as 4.1a #1                                            | yes      | as 4.1a; duplicate → field error `PHONE_TAKEN` (409)     | `phone`                                         |
| 3   | Password      | as 4.1a #2 + strength meter                           | yes      | ≥ 8 chars, show strength hint                            | `password` (bcrypt server-side, never returned) |
| 4   | Blood group   | `Select` — 8 options labelled `A+ … O−`               | yes      | must be a `BloodGroup` enum value (`A_POS` …)            | `profile.bloodGroup`                            |
| 5   | Date of birth | `Input type=date`, max = today                        | no       | valid ISO date; age ≥ 18 → helper text (blocker `[TBD]`) | `profile.dateOfBirth`                           |
| 6   | Weight (kg)   | `Input type=number` 30–200, step 1                    | no       | integer in range                                         | `profile.weightKg`                              |
| 7   | Declaration   | `Checkbox` "I confirm the details above are accurate" | yes      | must be checked to enable submit                         | — (client-only guard)                           |

#### 4.1c Register — role: HOSPITAL

Payload: `POST /auth/register { role:"HOSPITAL", phone, password, profile:{…} }` — also creates `HospitalVerification` with status `PENDING` (§6.1).

| #   | Field                 | Control                                                 | Required | Validation / format                   | Maps to                                                                                                                                 |
| --- | --------------------- | ------------------------------------------------------- | -------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Hospital name         | `Input text`                                            | yes      | 2–100 chars                           | `profile.name`                                                                                                                          |
| 2   | Phone / password      | as 4.1a #1–#2                                           | yes      | as 4.1a                               | `phone` / `password`                                                                                                                    |
| 3   | Address               | `Textarea`, 3 rows                                      | yes      | 10–300 chars, street + area + city    | `profile.address`                                                                                                                       |
| 4   | Latitude              | `Input type=number` (6 dp) + **Use my location** button | yes      | −90…90; button fills from geolocation | `profile.latitude` (used as map center + radius origin)                                                                                 |
| 5   | Longitude             | `Input type=number` (6 dp)                              | yes      | −180…180                              | `profile.longitude`                                                                                                                     |
| 6   | Contact               | `Input type=tel`, `+91` prefix                          | yes      | 10 digits                             | `profile.contact`                                                                                                                       |
| 7   | Registration document | `Input type=file` (pdf/jpg/png, ≤ 5 MB)                 | yes      | extension + size check client-side    | `profile.documentUrl` — **upload API `[TBD-endpoint]`**; until it exists, a URL text input prefilled with a `placeholders/doc.svg` link |

#### 4.1d Register — role: BANK

Payload: `POST /auth/register { role:"BANK", phone, password, profile:{…} }` — same as hospital **minus #7** (no document): name, phone, password, address, latitude, longitude, contact.

#### 4.1e Register — role: ADMIN

Self-registration is disabled (`403 ADMIN_NOT_SELF_SERVE`); the tab renders an info panel: "Admin accounts are provisioned by the team." The seeded admin is `+919890000000` / `Test@1234` (login via 4.1a).

### 4.2 Screen D2 — Home + _Available Now_ toggle

Route: `/donor`.

```
┌────────────────────────────────────────────┐
│  Hi, Asha Rao                    O+ chip  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  Availability                        │  │
│  │  [ ●●●  AVAILABLE NOW ]   ← toggle  │  │
│  │  last ping 12 s ago · 12.9716,77.639 │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ▸ Why we ask for location  (primer, §4.2a)│
│                                            │
│  Reliability                                │
│  ┌──────────┬──────────┬──────────┐        │
│  │  score   │ donated  │ no-show │        │
│  │   100    │    6     │    0    │        │
│  └──────────┴──────────┴──────────┘        │
│                                            │
│  Cooldown: eligible since 12 Mar 2026      │
│  (from donor.lastDonationDate)             │
└────────────────────────────────────────────┘
```

- **4.2a Permission primer (mandatory):** before the first `navigator.geolocation` call, show an in-app modal — _"BloodLink uses your location only while the toggle is on, only for hospitals that request donors nearby, and fuzzes it to ~250 m until you accept."_ → buttons **Allow location** / **Not now**. Only then call `getCurrentPosition`. Never trigger the browser prompt cold (README §10).
- **Toggle ON:** state machine in `useAvailability` (§8.2) → `PATCH /donor/availability {status:"online"}` → start `watchPosition` ping loop → `POST /donor/location {lat,lng}` every 45 s; show "pinging" heartbeat with seconds-since-last-ack.
- **Toggle OFF:** stop watcher → `PATCH … {status:"offline"}` → show "You will not receive alerts".
- **States:** permission denied → red inline card with fix instructions + retry; API 409 `DONOR_OFFLINE` while turning pings on → re-sync state; `GET /auth/me` loading → 3 `Skeleton` blocks; socket/ping failure → amber "reconnecting".
- Data: `GET /auth/me` → `{ donor: { name, bloodGroup, eligible, lastDonationDate, isOnline } }`.

### 4.3 Screen D3 — Incoming request (full-screen alert)

Route: `/donor/alert/:requestId`. Reached from WhatsApp action link **or** (once built) an `incoming_request` socket push; until then the donor app polls `GET /donor/requests` every 15 s while available **`[TBD-endpoint: dedicated event]`**.

```
┌────────────────────────────────────────────┐
│  ⚠  EMERGENCY REQUEST            CRITICAL │  ← full-bleed red, pulse
│  ────────────────────────────────────────  │
│  City Care Hospital · Indiranagar          │
│  1.2 km away · needed: 3 units             │
│                                            │
│   O+   ●●●  3 units      ← requested items│
│   A+   ●●●  2 units                       │
│                                            │
│  Responds in:  04:58   ← countdown window  │
│                                            │
│  [   DECLINE  ]        [   ACCEPT   ]      │
└────────────────────────────────────────────┘
```

- Items come from `GET /donor/requests` (`responses[].request.items[]`), each with `bloodGroup`, `component`, `unitsNeeded`.
- **Accept** → `POST /donor/request/:id/respond {action:"accept"}` → response carries `{status, accepted, qr}` → navigate `/donor/qr/:requestId`.
- **Decline** → same endpoint with `decline` → toast "Declined" → back to `/donor`.
- **Conflict states:** 409 `ALREADY_FULFILLED` → "This request was already filled" full-screen; expired countdown → auto-dismiss to home.
- Loading: poster-style skeleton; error: `ErrorState` + "Go back".

### 4.4 Screen D4 — Request detail (accept / decline)

Route: `/donor/request/:requestId` (from history, or the "view details" link on a push). Same accept/decline actions as D3, laid out as a readable page instead of an alert.

```
┌────────────────────────────────────────────┐
│ ← Back                    StatusPill OPEN │
│ City Care Hospital                         │
│ 100 Feet Rd, Indiranagar · 1.2 km          │
│ Urgency: [CRITICAL]   Raised 4 min ago     │
│ ─────────────────────────────────────────  │
│ Requested          Needed   Fulfilled      │
│ O+ · whole blood     3        1  ▓▓░░ 33%  │
│ A+ · whole blood     2        0  ░░░░  0%  │
│ ─────────────────────────────────────────  │
│ Your eligibility: ✓ eligible · cooldown ends …│
│ [ DECLINE ]                 [ ACCEPT ]     │
└────────────────────────────────────────────┘
```

- After accepting, the action row is replaced by **"Show QR →"** linking to D5; after declining, a disabled "Responded: declined" state.
- Live: joins `request:{id}` room; on `request_status_update` re-render progress bars and, if status → `FULFILLED`, show "Request filled — thanks!".
- States: loading skeleton, 404 `REQUEST_NOT_FOUND`, 409 `ALREADY_FULFILLED`.

### 4.5 Screen D5 — QR display + expiry countdown

Route: `/donor/qr/:requestId`.

```
┌────────────────────────────────────────────┐
│ ← Back        Show this QR at reception    │
│                                            │
│         ┌────────────────────┐             │
│         │  ██████████████    │             │
│         │  █ QR CODE █      │  ← <img     │
│         │  ██████████████    │    dataUrl> │
│         └────────────────────┘             │
│                                            │
│   valid for  12:41   ← CountdownBadge      │
│   single-use · signed by BloodLink         │
│                                            │
│  City Care Hospital · Request #… · O+      │
│  [ Refresh token ]  [ View request ]       │
└────────────────────────────────────────────┘
```

- Data: `GET /donor/request/:id/qr-token` → `{ token, qrDataUrl, expiresAt }`; render `qrDataUrl` directly as `<img>` (no client-side QR generation needed — but keep the `qrcode` package for the fallback path where only `token` is returned).
- `useCountdown(expiresAt)`: `mm:ss`, red + pulse under 2:00, at 00:00 → overlay "QR expired" + **Refresh token** button (re-fetch; server issues a fresh token).
- On `request_status_update` with `status = FULFILLED` → success overlay "Arrival confirmed 🎉 score +10" (score change comes from the next `GET /auth/me`).
- Also accept the WhatsApp public link path: `/donor/respond/:token?action=accept|deny` is backend-rendered HTML — no frontend screen needed; just link to it from message copy.
- States: loading (shimmer QR placeholder), 404/409, camera-less device note "[TBD] hospital must scan from a phone".

### 4.6 Screen D6 — History + reliability stats

Route: `/donor/history`.

```
┌────────────────────────────────────────────┐
│  My donations                              │
│  ┌───────┬──────────┬───────┬────────────┐ │
│  │ score │ completed│ no-show│ streak    │ │  ← stat cards (mock until
│ │  100  │    6     │   0   │  4 mo [TBD]│ │     [TBD-endpoint] stats API)
│  └───────┴──────────┴───────┴────────────┘ │
│  Filter: [ all | arrived | declined | no-show ]│
│  ┌────────────────────────────────────────┐│
│  │ ✓ 12 Sep · City Care · O+ · 1 unit     ││  ← rows from GET /donor/requests
│  │ ✓ 02 Sep · Sunrise   · A+ · 2 units    ││    (responses[].status pill)
│  │ ✗ 21 Aug · Lakeview  · declined        ││
│  └────────────────────────────────────────┘│
│  [Load more] (list is capped at 25 by API) │
└────────────────────────────────────────────┘
```

- Score/completed/no-show currently come only from seed/mock — `GET /auth/me` returns `eligible` + `lastDonationDate` but **not reliability fields** → stats cards read `mock/donors.ts` behind the `[TBD-endpoint]` badge.
- Row click → `/donor/request/:id` (D4) for detail.
- States: skeleton rows, `EmptyState` "No responses yet — turn on Available Now".

### 4.7 Screen D7 — Profile

Route: `/donor/profile`. Tabs: **Profile** / **Security**.

```
┌────────────────────────────────────────────┐
│  (avatar)  Asha Rao          O+ chip       │
│  +919800000001 · eligible ✓                │
│  ────────────────────────────────────────  │
│  [ Profile ]  [ Security ]                 │
│  Name            [ Asha Rao          ]     │
│  Date of birth   [ 1996-03-14        ]     │
│  Weight (kg)     [ 62                ]     │
│  Blood group     [ O+  ▾ ] (locked if      │
│                    donated < 90 d [TBD])   │
│  Last donation   12 Dec 2025               │
│  [ Save changes ]                          │
│  ────────────────────────────────────────  │
│  Security: change password, Sign out       │
└────────────────────────────────────────────┘
```

- Read fields from `GET /auth/me`. **Save is `[TBD-endpoint]`** (no `PATCH /donor` exists yet) → button disabled with tooltip "profile editing API pending" behind the mock badge.

**Tab Profile — fields:**

| #   | Field         | Control                    | Required | Validation / format              | Source / notes                                                                |
| --- | ------------- | -------------------------- | -------- | -------------------------------- | ----------------------------------------------------------------------------- |
| 1   | Avatar        | image slot (read-only)     | —        | —                                | `placeholders/avatar.svg`                                                     |
| 2   | Phone         | read-only text             | —        | —                                | `GET /auth/me` → `phone`                                                      |
| 3   | Full name     | `Input text`               | yes      | 2–60 chars                       | `donor.name`                                                                  |
| 4   | Blood group   | `Select` (8 options)       | yes      | `BloodGroup` enum                | locked to `O+`-style value; disable if donated < 90 d `[TBD]`                 |
| 5   | Date of birth | `Input type=date`          | no       | max = today                      | `donor.dateOfBirth` (not in `me` payload → render from profile store `[TBD]`) |
| 6   | Weight (kg)   | `Input type=number` 30–200 | no       | integer in range                 | as above `[TBD]`                                                              |
| 7   | Last donation | read-only text             | —        | —                                | `donor.lastDonationDate`                                                      |
| 8   | Eligibility   | read-only badge            | —        | —                                | `donor.eligible`                                                              |
| 9   | Save changes  | primary `Button`           | —        | disabled while any field invalid | `[TBD-endpoint]`                                                              |

**Tab Security — fields:** current password (`Input password`, required, ≥ 8) → new password (required, ≥ 8, strength meter) → confirm new password (must equal new) → **Change password** button `[TBD-endpoint: no password-change API]`; **Sign out** button clears the token and routes to `/login`.

---

## 5. Blood Bank — 5 screens

### 5.1 Screen B1 — Dashboard + low-stock alerts

Route: `/bank`.

```
┌────────────────────────────────────────────┐
│ Red Cross Blood Centre            ✓ verified│
│ ┌──────────┬──────────┬─────────────────┐  │
│ │ total    │ low-stock│ out-of-stock    │  │
│ │ 14 units │ 3 cells  │ 2 cells         │  │  ← computed from GET /bank/inventory
│ └──────────┴──────────┴─────────────────┘  │
│ ⚠ Low stock                               │
│  · O− whole blood — 1 unit (threshold 4)   │
│  · AB− platelets — 0 units                 │
│  [ Review inventory → ]                    │
│ Recent movement  [TBD-endpoint] (mock)     │
│  +20 O+ whole blood · 2 h ago              │
└────────────────────────────────────────────┘
```

- Low-stock rule: threshold per cell, default **4 units** (constant `LOW_STOCK_THRESHOLD`, adjustable in B5); out-of-stock = 0 → red.
- All figures derived from `GET /bank/inventory` (single source). Recent-movement list = `mock/activity.ts`.

### 5.2 Screen B2 — Inventory matrix + add/edit modal

Route: `/bank/inventory`.

```
┌────────────────────────────────────────────┐
│ Inventory          [ + Add / update stock ]│
│ Component: ( whole blood | platelets | plasma )
│ ┌─────────┬─────┬─────┬─────┬────────────┐ │
│ │ Group   │ Qty │  ▲  │  ▼  │ State      │ │
│ ├─────────┼─────┼─────┼─────┼────────────┤ │
│ │ O−  ▪   │  1  │ +5  │ -1  │ ⚠ low      │ │  rows sorted O-→AB+
│ │ O+  ▪   │ 24  │ +20 │ -4  │ ok         │ │
│ │ A−  ▪   │  0  │ +10 │     │ ✕ empty    │ │
│ │ … 8 groups × 3 components (toggle or tabs)│
│ └─────────┴─────┴─────┴─────┴────────────┘ │
└────────────────────────────────────────────┘
   modal: ┌──────────────────────────┐
          │ Update stock            │
          │ Group  [ O+ ▾ ]         │
          │ Component [ whole ▾ ]   │
          │ Units [ 24 ]  (+/- steppers)
          │ [ Cancel ]  [ Save ]    │  → POST /bank/inventory (upsert)
          └──────────────────────────┘
```

- Grid = 8 blood groups (rows) × 3 components (columns) as the primary view, with a single-component filter as an alternate; each cell shows qty + color state (ok green / low amber / empty red).
- `+`/`−` buttons open the modal prefilled; Save → `POST /bank/inventory {bloodGroup, component, unitsAvailable}` (upsert server-side) → invalidate `['inventory']` → toast.
- States: skeleton grid, `ErrorState`, optimistic update with rollback on failure, `EmptyState` if the bank has zero rows ("Add your first stock entry").

**Add/edit modal — fields:**

| #   | Field      | Control                                     | Required | Validation / format                            | Maps to                                                    |
| --- | ---------- | ------------------------------------------- | -------- | ---------------------------------------------- | ---------------------------------------------------------- |
| 1   | Group      | `Select` (8 options, labels `A+ … O−`)      | yes      | `BloodGroup` enum; prefilled from cell clicked | `bloodGroup`                                               |
| 2   | Component  | `Select` `whole blood / platelets / plasma` | yes      | default `WHOLE_BLOOD`                          | `component`                                                |
| 3   | Units      | `Input type=number` + −/+ steppers          | yes      | integer 0–999 (0 = mark empty)                 | `unitsAvailable` (upsert on `bankId+bloodGroup+component`) |
| 4   | Delta hint | read-only text                              | —        | —                                              | "24 → 30 (+6)" preview before save                         |

### 5.3 Screen B3 — Stock activity

Route: `/bank/activity`. **`[TBD-endpoint]`** — no movement/audit API exists; render `mock/activity.ts` with the amber mock badge.

```
┌────────────────────────────────────────────┐
│ Stock activity        filter: [ all ▾ ]    │
│ ┌────────────────────────────────────────┐ │
│ │ +20 · O+ · whole blood · 2 h ago       │ │
│ │  -4 · O+ · whole blood · 5 h ago       │ │
│ │  -1 · O− · whole blood · yesterday     │ │
│ └────────────────────────────────────────┘ │
│ pagination: [ ‹ 1 2 3 › ]                 │
└────────────────────────────────────────────┘
```

Row delta colored green/red; empty state "No movements yet".

### 5.4 Screen B4 — Requests supplied to

Route: `/bank/requests`. **`[TBD-endpoint]`** — backend has no bank-facing requests view; mock list of hospital requests whose items this bank's stock covered.

```
┌────────────────────────────────────────────┐
│ Requests we supplied to                    │
│ ┌──────────┬───────────┬──────┬──────────┐ │
│ │ Hospital │ When      │ Units│ Status   │ │
│ │ City Care│ 12 Sep    │  3   │ FULFILLED│ │  → StatusPill
│ │ Sunrise  │ 09 Sep    │  2   │ MATCHED  │ │
│ └──────────┴───────────┴──────┴──────────┘ │
│ row click → [TBD] hospital public summary  │
└────────────────────────────────────────────┘
```

Loading/empty/error states as in §2.2 kit.

### 5.5 Screen B5 — Profile

Route: `/bank/profile`. Same skeleton as D7: org card + editable fields `[TBD-endpoint]`, plus **settings block** (local persistence).

```
┌────────────────────────────────────────────┐
│ (org logo)  Red Cross Blood Centre         │
│ Kasturba Rd, Bengaluru        ✓ verified   │
│ ─────────────────────────────────────────  │
│ Name        [ Red Cross Blood Centre    ]  │
│ Address     [ Kasturba Rd, Bengaluru    ]  │
│ Latitude    [ 12.9762  ]  Longitude [ 77.6033 ]│
│ Contact     [ +918012346001             ]  │
│ Low-stock threshold  [ 4 ] units           │
│ [ Save changes ]  (disabled: [TBD-endpoint])│
└────────────────────────────────────────────┘
```

**Fields:**

| #   | Field                | Control                        | Required | Validation / format | Source / notes                                            |
| --- | -------------------- | ------------------------------ | -------- | ------------------- | --------------------------------------------------------- |
| 1   | Org logo             | image slot (read-only)         | —        | —                   | `placeholders/org-logo.svg`                               |
| 2   | Verified badge       | read-only                      | —        | —                   | `bloodBank.verified` from `GET /auth/me`                  |
| 3   | Name                 | `Input text`                   | yes      | 2–100 chars         | `bloodBank.name`; `[TBD-endpoint]` save                   |
| 4   | Address              | `Textarea` 3 rows              | yes      | 10–300 chars        | `bloodBank.address`                                       |
| 5   | Latitude / Longitude | two `Input type=number` (6 dp) | yes      | −90…90 / −180…180   | map center for radius queries                             |
| 6   | Contact              | `Input type=tel` `+91` prefix  | yes      | 10 digits           | `bloodBank.contact`                                       |
| 7   | Low-stock threshold  | `Input type=number` 1–20       | yes      | integer; default 4  | **local only** (`localStorage`), consumed by B1/B2 alerts |
| 8   | Phone (login)        | read-only text                 | —        | —                   | `phone`                                                   |

---

## 6. Hospital — 7 screens

### 6.1 Verification-pending banner (shell-level, not a route)

Rendered at the top of every hospital page while `user.hospital.verificationStatus !== "VERIFIED"` (value from `GET /auth/me`):

```
┌────────────────────────────────────────────┐
│ ⏳ Verification pending — a BloodLink admin│
│ is reviewing your registration document.   │
│ You can prepare a request, but cannot      │
│ submit until verified.   [ View document ] │
│ status: PENDING     [TBD: "re-submit" flow]│
└────────────────────────────────────────────┘
```

- `REJECTED` variant (red): "Registration rejected — contact support `[TBD]`".
- Effect: `/hospital/new` submit button disabled; if the API still returns 403 `HOSPITAL_NOT_VERIFIED`, show the same copy as an error toast (defense in depth).
- `VERIFIED` → banner hidden; topbar shows a green ✓ badge instead.

### 6.2 Screen H1 — Raise multi-group request

Route: `/hospital/new`.

```
┌────────────────────────────────────────────┐
│ New emergency request                      │
│ Urgency: ( LOW | MEDIUM | HIGH | CRITICAL )│
│ Radius: [ 5 ] km   (slider 1–25)           │
│                                            │
│ Items                                      │
│ ┌────────────────────────────────────────┐ │
│ │ group [O+ ▾] component [whole ▾]       │ │
│ │ units  [ 3 ] (−/+)              [ ✕ ]  │ │
│ ├────────────────────────────────────────┤ │
│ │ group [A+ ▾] component [whole ▾]       │ │
│ │ units  [ 2 ] (−/+)              [ ✕ ]  │ │
│ └────────────────────────────────────────┘ │
│ [ + Add blood group ]                      │
│                                            │
│ Summary: 5 units across 2 groups · 5 km    │
│ [ Save draft ]              [ Raise request]│
└────────────────────────────────────────────┘
```

- Dynamic rows (min 1, max 8); duplicate group+component rows blocked client-side with inline error.
- Submit → `POST /hospital/request {items:[{bloodGroup, component, unitsNeeded}], radiusKm, urgency}` → 201 → navigate `/hospital/request/:id/map` (the wow moment, README §3).
- Errors: 403 `HOSPITAL_NOT_VERIFIED` → banner copy + disabled state; validation (units ≥ 1) inline; network → toast + form preserved.
- Loading: button spinner only (form stays editable).

**Fields:**

| #   | Field             | Control                                            | Required | Validation / format                                     | Maps to                                      |
| --- | ----------------- | -------------------------------------------------- | -------- | ------------------------------------------------------- | -------------------------------------------- |
| 1   | Urgency           | segmented control `LOW / MEDIUM / HIGH / CRITICAL` | yes      | default `MEDIUM`; `CRITICAL` gets red pulse style       | `urgency` (Urgency enum)                     |
| 2   | Radius            | `Slider` 1–25 + number readout, km                 | yes      | integer 1–25, default 5                                 | `radiusKm` (drives server-side donor search) |
| 3   | Item: blood group | `Select` (8 options)                               | yes      | `BloodGroup` enum; unique per row-set                   | `items[].bloodGroup`                         |
| 4   | Item: component   | `Select` `whole blood / platelets / plasma`        | yes      | default `WHOLE_BLOOD` (`Component` enum)                | `items[].component`                          |
| 5   | Item: units       | `Input type=number` + −/+ steppers                 | yes      | integer 1–20 (over-book risk → warn > 10 `[TBD]`)       | `items[].unitsNeeded`                        |
| 6   | Add row           | ghost `Button "+ Add blood group"`                 | —        | hidden at 8 rows                                        | —                                            |
| 7   | Remove row        | icon `Button ✕` per row                            | —        | hidden when only 1 row remains                          | —                                            |
| 8   | Save draft        | ghost `Button`                                     | no       | writes form JSON to `sessionStorage` (survives refresh) | client-only                                  |

### 6.3 Screen H2 — Live map (Rapido-style) ★ demo centrepiece

Route: `/hospital/request/:requestId/map`.

```
┌────────────────────────────────────────────┐
│ ←  City Care · CRITICAL · OPEN    04:12    │
├────────────────────────────────────────────┤
│                        ▲ pulsing hospital  │
│     ·  ·               │ marker (center)   │
│        ·    (donor dots, colored by        │
│   ·        blood group, styled by status)  │
│                                            │
│  ┌ legend ───────────────────────────────┐ │
│  │ ● grey  notified   ● blue viewed      │ │
│  │ ● green accepted   ◉ gold arrived     │ │
│  │ ● faded declined/expired/no-show      │ │
│  └───────────────────────────────────────┘ │
│  tap dot → popover: ┌────────────────────┐ │
│                     │ Asha R. · O+       │ │
│                     │ 1.2 km · score 100 │ │
│                     │ ✓ ACCEPTED         │ │
│                     └────────────────────┘ │
├────────────────────────────────────────────┤
│ items: O+ 1/3  A+ 0/2      [ Open detail ] │
└────────────────────────────────────────────┘
```

- `react-leaflet` map, OSM tiles; hospital = `DivIcon` with pulsing CSS animation at request's hospital coords.
- Donors = circle markers: **blood-group color** (§2.3) with **status styling** (§2.3 status colors): grey/blue/green normal, gold ring for `ARRIVED`, 40 % opacity for `DECLINED|EXPIRED|NO_SHOW`.
- Data: initial `GET /hospital/request/:id` (includes `responses[]` with donor `{name, bloodGroup, latitude, longitude}`), then live via socket.
- Room: on mount `join_request_room(requestId)`; handle `donor_location_update` (upsert dot: position, status, `distanceKm`, `reliabilityScore`) and `request_status_update` (header status, item progress, auto-close overlay when `FULFILLED`).
- Popover fields exactly: blood group, distance, reliability score, current status — nothing else (donor privacy, README §10: no phone, no precise address pre-arrival).
- Privacy: render fuzzed coords pre-accept (backend responsibility) — the frontend never displays a donor's precise pin until status is `ACCEPTED`/`ARRIVED`.
- States: loading → map skeleton + shimmer dots; no responses yet → "Waiting for donors…" pulse on legend; socket drop → amber banner "map is 8 s stale — reconnecting" + refetch; empty room cleanup on unmount (`socket.disconnect()` only when leaving donor/hospital areas entirely).

### 6.4 Screen H3 — Request detail (per-item progress)

Route: `/hospital/request/:requestId`.

```
┌────────────────────────────────────────────┐
│ ← Request #clx…          [ OPEN ] [ HIGH ] │
│ Raised 4 min ago · radius 5 km             │
│ ─────────────────────────────────────────  │
│ Item progress                              │
│ O+ · whole blood   1/3   ▓▓░░░  33%        │
│ A+ · whole blood   0/2   ░░░░░   0%        │
│ ─────────────────────────────────────────  │
│ Responders (12)                            │
│ ✓ Asha R.   O+  1.2 km  score 100  ARRIVED│  ← table, live via socket
│ ● Ravi K.   A+  1.2 km  score  82  ACCEPTED│
│ ✗ Farhan A. A− 14.3 km  score  92  DECLINED│
│ ─────────────────────────────────────────  │
│ [ View live map ]   [ Close request ] [TBD]│
└────────────────────────────────────────────┘
```

- `GET /hospital/request/:id`; re-render on `request_status_update` / `donor_location_update`.
- Progress bar per `RequestItem` (`unitsFulfilled` / `unitsNeeded`) — never a single request-level number (AGENTS invariant).
- Statuses via `StatusPill`; row click → donor popover details (same fields as map).
- Close button `[TBD-endpoint]` (no close/expire endpoint yet) → disabled.

### 6.5 Screen H4 — QR scanner

Route: `/hospital/scan`.

```
┌────────────────────────────────────────────┐
│ ← Scan donor QR                            │
│  request: [ City Care · CRITICAL ▾ ]       │
│  ┌──────────────────────────────────────┐  │
│  │         ▢ viewfinder ▢              │  │  ← html5-qrcode area
│  │            (camera)                 │  │
│  └──────────────────────────────────────┘  │
│  or paste token: [ ____________ ] [Verify] │
│  status line: ready / scanning…            │
└────────────────────────────────────────────┘
```

- `html5-qrcode` `start({facingMode:"environment"})`; on decode → `POST /hospital/request/:id/verify-arrival {token}`.
- Success → green overlay: "Arrival verified — Asha R., O+ · units 2/3" + auto-dismiss 3 s; failure mapping: 409 `TOKEN_ALREADY_USED` → red "already used (scanned earlier)"; 400 `TOKEN_REQUEST_MISMATCH` → "QR belongs to another request"; 404/expired → "expired — ask donor to refresh".
- Manual paste fallback (desktop demo, no camera) + "choose QR image file" fallback (`html5-qrcode` file scan).
- Request selector required because tokens carry `requestId`; picking the wrong one surfaces `TOKEN_REQUEST_MISMATCH` cleanly.
- States: permission denied → instructions + paste fallback; no camera → paste-only layout.

**Fields:**

| #   | Field        | Control                                                                                   | Required | Validation / format                | Maps to                                             |
| --- | ------------ | ----------------------------------------------------------------------------------------- | -------- | ---------------------------------- | --------------------------------------------------- |
| 1   | Request      | `Select` of this hospital's `OPEN`/`MATCHED` requests (label: urgency + age + item count) | yes      | default = most recent open request | path param `:id`                                    |
| 2   | QR token     | camera viewfinder (`html5-qrcode`)                                                        | one of   | decodes to a token string          | `POST /hospital/request/:id/verify-arrival {token}` |
| 3   | Manual token | `Input text` + **Verify** button (fallback)                                               | one of   | non-empty, no whitespace           | as above                                            |
| 4   | Image file   | `Input type=file` (scan from upload)                                                      | one of   | jpg/png                            | `html5-qrcode` file scan                            |

### 6.6 Screen H5 — History

Route: `/hospital/history`. Table from `GET /hospital/requests` (capped 25): `Raised | Urgency | Items (chips) | Responders count (_count.responses) | Status | →`. Filters by status/urgency (client-side). Row click → request detail. Skeleton/empty/error states as kit.

### 6.7 Screen H6 — Profile

Route: `/hospital/profile`.

```
┌────────────────────────────────────────────┐
│ (org logo)  City Care Hospital   ✓ VERIFIED│
│ 100 Feet Rd, Indiranagar                   │
│ ─────────────────────────────────────────  │
│ Name        [ City Care Hospital        ]  │
│ Address     [ 100 Feet Rd, Indiranagar   ] │
│ Latitude    [ 12.9719 ] Longitude [ 77.6412]│
│ Contact     [ +918012345001             ]  │
│ Document    📄 registration.pdf   [ View ] │
│ Status      [VERIFIED]  reviewed 12 Sep    │
│ [ Save changes ]  (disabled: [TBD-endpoint])│
└────────────────────────────────────────────┘
```

**Fields:**

| #   | Field                 | Control                                     | Required | Validation / format         | Source / notes                                          |
| --- | --------------------- | ------------------------------------------- | -------- | --------------------------- | ------------------------------------------------------- |
| 1   | Org logo              | image slot (read-only)                      | —        | —                           | `placeholders/org-logo.svg`                             |
| 2   | Hospital name         | `Input text`                                | yes      | 2–100 chars                 | `GET /auth/me` → `hospital.name`; save `[TBD-endpoint]` |
| 3   | Address               | `Textarea` 3 rows                           | yes      | 10–300 chars                | `hospital.address`                                      |
| 4   | Latitude / Longitude  | two `Input type=number` (6 dp)              | yes      | −90…90 / −180…180           | request-form default center + map center                |
| 5   | Contact               | `Input type=tel` `+91` prefix               | yes      | 10 digits                   | `hospital.contact`                                      |
| 6   | Registration document | thumbnail + **View** link                   | —        | —                           | `documentUrl` (from `HospitalVerification`)             |
| 7   | Verification status   | read-only `StatusPill` + reviewed timestamp | —        | `PENDING/VERIFIED/REJECTED` | `hospital.verificationStatus`                           |
| 8   | Phone (login)         | read-only text                              | —        | —                           | `phone`                                                 |
| 9   | Staff / users         | read-only list `[TBD]`                      | —        | —                           | single-user-per-hospital today                          |

---

## 7. Admin — 6 screens

### 7.1 Screen A1 — Dashboard stats

Route: `/admin`. **`[TBD-endpoint]`** — no stats API; render `mock/adminStats.ts` with the amber mock badge (swap to live later; keep all charts reading one `useAdminStats()` hook).

```
┌────────────────────────────────────────────┐
│ Platform overview               (mock badge)│
│ ┌────────┬────────┬────────┬────────┐      │
│ │ donors │ hospitals│ open   │ fulfilled│   │
│ │  142   │   18    │   3    │  264   │     │
│ └────────┴────────┴────────┴────────┘      │
│ [ Donations by week ]   [ Units by group ]  │  ← recharts
│  ▁▃▅▂▇▆                 bar chart by ABO    │
│ ⏳ 3 hospitals awaiting verification       │  ← live link to A2
└────────────────────────────────────────────┘
```

Charts: `AreaChart` (donations/7 days), `BarChart` (units per blood group), stat cards on top. Loading → chart skeletons; empty → `EmptyState`.

### 7.2 Screen A2 — Pending verification queue + review modal

Route: `/admin/verifications`.

```
┌────────────────────────────────────────────┐
│ Pending verifications (3)                  │
│ ┌────────────────────────────────────────┐ │
│ │ Sunrise Multispeciality · Koramangala  │ │
│ │ doc: registration.pdf        [ Review] │ │  ← row → modal
│ │ Lakeview Hospital · Jayanagar [ Review]│ │
│ └────────────────────────────────────────┘ │
└────────────────────────────────────────────┘
   modal: ┌──────────────────────────────┐
          │ Sunrise Multispeciality      │
          │ address · contact · map pin  │
          │ [ 📄 open document ]         │
          │ Notes (optional) [ ______ ]  │
          │ [ Reject ]    [ Verify ✓ ]   │  → POST /admin/hospitals/:id/verify
          └──────────────────────────────┘
```

- `GET /admin/hospitals/pending` → list; Verify/Reject → `POST /admin/hospitals/:id/verify {status:"VERIFIED"|"REJECTED"}` with `ConfirmDialog` for reject → invalidate list + toast.
- States: skeleton rows, `EmptyState` "All caught up ✓", error + retry.

**Review modal — fields:**

| #   | Field             | Control                                      | Required  | Validation / format          | Maps to / notes                             |
| --- | ----------------- | -------------------------------------------- | --------- | ---------------------------- | ------------------------------------------- |
| 1   | Hospital name     | read-only text                               | —         | —                            | from pending list                           |
| 2   | Address / contact | read-only text + map pin preview             | —         | —                            | gives reviewer context                      |
| 3   | Document          | **Open document** link / embedded preview    | —         | pdf/jpg/png                  | `documentUrl`                               |
| 4   | Reviewer note     | `Textarea` 2 rows                            | no        | ≤ 500 chars                  | **`[TBD-endpoint]`** — not sent today       |
| 5   | Decision          | danger `Reject` + success `Verify ✓` buttons | yes (one) | Reject opens `ConfirmDialog` | `POST /admin/hospitals/:id/verify {status}` |

### 7.3 Screen A3 — All hospitals

Route: `/admin/hospitals`. **`[TBD-endpoint]`** (only the pending list exists). Table: name · address · status pill (`PENDING|VERIFIED|REJECTED`) · raised count · verify action (reuse A2 modal). Mock from seed hospitals.

### 7.4 Screen A4 — Donors / reliability leaderboard

Route: `/admin/donors`. **`[TBD-endpoint]`** — data from `mock/donors.ts` (seeded: scores 100/82/95/88/92, completed/no-show counts).

```
┌────────────────────────────────────────────┐
│ Reliability leaderboard       sort: score ▾│
│ #  Name         Group  Score  Done  No-show│
│ 1  Asha Rao     O+      100     6     0   │
│ 2  Meera Iyer   B−       95     5     0   │
│ 3  Farhan Ali   A−       92     7     1   │
│ …                                          │
│ rows with no-show > 0 → amber warning icon │
└────────────────────────────────────────────┘
```

### 7.5 Screen A5 — All requests

Route: `/admin/requests`. **`[TBD-endpoint]`**. Table: id · hospital · urgency pill · items (group chips + `fulfilled/needed`) · status pill · raised; filters (status, urgency, blood group); row → detail drawer reusing H3 layout (read-only).

### 7.6 Screen A6 — Settings

Route: `/admin/settings`.

```
┌────────────────────────────────────────────┐
│ Settings                                  │
│ Platform (read-only mirror of backend env) │
│  Wave size [10]  No-show grace [120] min   │
│  Stale ping [90] s   Action-link TTL [720] │
│ Notifications                              │
│  WhatsApp linked (…)        [TBD]          │
│ Data policy                                │
│  ☑ synthetic/test data only statement      │
│ Danger zone                                │
│  [ Reset demo data → instructions ]        │
└────────────────────────────────────────────┘
```

**Fields:**

| #   | Field                       | Control                            | Required | Validation / format                                           | Source / notes                                      |
| --- | --------------------------- | ---------------------------------- | -------- | ------------------------------------------------------------- | --------------------------------------------------- |
| 1   | Matching wave size          | `Input type=number` (read-only)    | —        | —                                                             | mirrors `WAVE_SIZE` (10) `[TBD: live env]`          |
| 2   | No-show grace (min)         | `Input type=number` (read-only)    | —        | —                                                             | mirrors `NO_SHOW_GRACE_MINUTES` (120)               |
| 3   | Stale ping (s)              | `Input type=number` (read-only)    | —        | —                                                             | mirrors `STALE_PING_SECONDS` (90)                   |
| 4   | Action-link TTL (min)       | `Input type=number` (read-only)    | —        | —                                                             | mirrors `ACTION_LINK_TTL_MINUTES` (720)             |
| 5   | WhatsApp channel            | read-only status + hint `[TBD]`    | —        | —                                                             | `WHATSAPP_ENABLED`                                  |
| 6   | Data-policy acknowledgement | `Checkbox` (checked)               | yes      | must stay checked                                             | README §10 synthetic-data statement, `localStorage` |
| 7   | Reset demo data             | danger button → instructions modal | —        | shows `bun run db:seed` command (does **not** run it from UI) | —                                                   |
| 8   | Admin account               | read-only: name + phone            | —        | —                                                             | `GET /auth/me`                                      |

---

## 8. Realtime & state wiring

### 8.1 Socket event matrix

| Event                   | Direction       | Payload (as typed in `src/lib/socket.ts`)                                                  | Consumers                                   |
| ----------------------- | --------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------- |
| `join_request_room`     | client → server | `requestId: string` (server joins socket to room `request:{id}`)                           | H2 map, H3 detail, D3–D5 donor screens      |
| `donor_location_update` | server → room   | `{donorId, name, bloodGroup, status, latitude, longitude, distanceKm?, reliabilityScore?}` | H2 live map (dot upsert), H3 responder row  |
| `request_status_update` | server → room   | `{requestId, status, items:[{bloodGroup, unitsNeeded, unitsFulfilled}]}`                   | H2 header/progress, H3 bars, D4/D5 overlays |

Rules:

- One shared `socket.io-client` instance (`lib/socket.ts`), `autoConnect`, reconnect w/ backoff; connect only inside authenticated shells (disconnect on logout).
- Join room on mount, leave on unmount — **always** `socket.emit("leave", …)`-equivalent cleanup via `socket.disconnect()` scope or room refcount, so stale maps don't accumulate.
- No polling while the socket is connected; if `socket.connected === false`, fall back to refetch every 10 s and flag the UI "stale" (amber).
- **Donor incoming requests have no event yet** — poll `GET /donor/requests` every 15 s while availability is ON, diff against seen request ids, route to D3 on a new `OPEN` response with no decision. Revisit when a backend `incoming_request` event exists `[TBD-endpoint]`.

### 8.2 Geolocation ping loop (`useAvailability`)

```
toggle ON
  1. primer shown once → geolocation permission
  2. PATCH /donor/availability {status:"online"}
  3. watchPosition(success, error, {enableHighAccuracy:false, maximumAge:10000})
       on position → throttle to 45 s → POST /donor/location {lat,lng}
                     → set lastPingAt = Date.now()
  4. heartbeat UI: "pinged Ns ago"; amber if N > 60

toggle OFF / unmount / visibilitychange(hidden→long)
  1. clear watcher + timers
  2. PATCH /donor/availability {status:"offline"}
```

- Permission states: `prompt | granted | denied | unsupported`; denied → inline card with recovery steps, toggle disabled.
- HTTPS assumed (README §10); in dev, `localhost` is exempt.
- `beforeunload` → best-effort `PATCH … offline` with `navigator.sendBeacon`-style `keepalive: true` fetch — **advisory only**; backend staleness (`STALE_PING_SECONDS = 90`) is the source of truth (AGENTS §Matching).

### 8.3 Tab staleness & visibility

| Trigger                             | Action                                                             |
| ----------------------------------- | ------------------------------------------------------------------ |
| `visibilitychange` → hidden (donor) | keep pings (browser may throttle) but show "backgrounded" state    |
| hidden > 2 min (donor)              | auto toggle OFF, notify on return `[TBD: decide]`                  |
| `navigator.onLine === false`        | `OfflineBanner`, pause mutations, socket auto-reconnects           |
| `visibilitychange` → visible        | refetch active queries (`invalidateQueries` on focus, React Query) |
| token expired (401)                 | clear session → `/login?reason=expired`                            |

### 8.4 Client state split

- **Server state** → React Query only (single source; no hand-rolled caches).
- **Session** → zustand `useSession`: `{token, user}` hydrated from `localStorage`, refreshed via `GET /auth/me` on boot/focus.
- **Ephemeral UI** → local component state (modals, form drafts). Form drafts for `/hospital/new` persist to `sessionStorage` so a refresh doesn't lose a half-built request.

---

## 9. Build order

Four milestones; each ends with `bun run check-types` + a manual click-through of the checklist. Do not start a milestone while the previous one's demo path is broken.

### M1 — Shell & auth (foundation)

- [ ] Scaffold `apps/frontend` (Vite + React + TS + Tailwind, workspace wiring, `dev` script in turbo)
- [ ] Vite proxy for `/auth /donor /hospital /bank /admin /health /socket.io`
- [ ] `lib/api.ts` (bearer, error envelope, 401 handling) + `useSession` store
- [ ] UI kit components (§2.2) + color vocabulary (§2.3)
- [ ] `AppShell` (sidebar/topbar/connection dot) + `RoleGate` redirects
- [ ] D1 login/register for all 4 roles; dev demo-account chips
- [ ] Route table from §3.2 stubbed with `EmptyState` placeholders

### M2 — Bank + donor core

- [ ] B1 dashboard + low-stock computation from `GET /bank/inventory`
- [ ] B2 inventory matrix + add/edit modal (upsert, optimistic update, rollback)
- [ ] B3/B4 mock-backed screens with `[TBD-endpoint]` badge
- [ ] D2 permission primer + availability toggle + ping loop (§8.2)
- [ ] D3 incoming-request alert + D4 detail (accept/decline, 409 handling)
- [ ] D5 QR screen (`qr-dataUrl`, countdown, refresh) — end-to-end accept → QR
- [ ] D6 history from `GET /donor/requests`; D7 profile (read-only)
- [ ] Offline banner + stale-ping UI states

### M3 — Hospital + live map + QR scan

- [ ] H0 verification banner driven by `GET /auth/me` (all 3 states)
- [ ] H1 multi-group request form (dynamic rows, radius, urgency, validation)
- [ ] H2 live map: pulsing hospital marker, blood-group dots, 5-state status styles, legend, popover, socket room wiring
- [ ] H3 request detail with per-item progress + live responders
- [ ] H4 scanner (`html5-qrcode`) + manual token paste + full error mapping
- [ ] H5 history, H6 profile
- [ ] **Demo path: hospital raises request → donors appear on map → donor accepts → QR shows → hospital scans → progress bar ticks → FULFILLED**

### M4 — Admin + polish

- [ ] A1 stats dashboard (recharts, mock data behind one hook)
- [ ] A2 verification queue + review modal wired to both admin endpoints
- [ ] A3–A5 mock tables with `[TBD-endpoint]` badges, shared filters
- [ ] A6 settings + seed-data instructions
- [ ] Socket reconnection/stale-UI polish across all screens
- [ ] Loading/empty/error pass: every screen uses Skeleton/EmptyState/ErrorState
- [ ] Responsive pass (donor screens must work at 390 px width)
- [ ] Lighthouse/a11y basics: focus rings, `aria-label`s on icon buttons, contrast on status colors
- [ ] `bunx prettier --write apps/frontend/**/*.{ts,tsx}` + `bun run check-types`

**Out of scope for now** (do not block the demo): public search page (`GET /search` unimplemented), Web Push/VAPID, Redis-backed realtime scale-out, location fuzzing UI (server-side), donor profile editing, bank movement log API.
