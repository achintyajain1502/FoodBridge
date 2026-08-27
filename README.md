# FoodBridge — Food Donation Platform (Version 1)

A minimal, working scaffold for the food donation platform: Donor → NGO → Admin,
built exactly to the V1 scope agreed on (no transporter/volunteer role, no certificate
generation yet).

```
food-donation-platform/
├── backend/     Node.js + Express + PostgreSQL REST API
└── frontend/    React + TypeScript + Vite
```

## Workflow implemented

```
Donor registers/logs in
  → Posts a donation (food type, quantity, pickup address, city, expiry)
  → Donation is "available"
NGO registers/logs in
  → Browses available donations (optionally filtered by city)
  → Accepts one  →  status becomes "accepted"
  → Marks it "completed" once picked up
Donor
  → Can cancel while still "available"
  → Sees full history + status of everything they've posted
Admin
  → Verifies donor/NGO accounts
  → Monitors all donations, any status
  → Sees basic platform stats
```

Every status change is written to a `donation_status_log` table, so a full
audit trail exists for FR-style "view donation history" requirements — you
don't need a separate history table per donation.

---

## 1. Backend setup

```bash
cd backend
cp .env.example .env       # then edit DB credentials + JWT_SECRET
npm install
npm run db:init            # creates tables from db/schema.sql
npm run db:seed            # adds safe, repeatable demo users and donations
npm run dev                # starts on http://localhost:5000
```

Requires a running PostgreSQL instance and an empty database matching
`DB_NAME` in `.env`. Create it first, e.g.:

```bash
createdb food_donation
```

### Deploying with hosted PostgreSQL

For an online deployment, use a hosted PostgreSQL provider such as Neon,
Supabase, or Render. Set these environment variables in the backend service:

```text
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d
```

Do not use the local `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, or
`DB_PASSWORD` fallback in production. After setting `DATABASE_URL`, run
`npm run db:init --prefix backend` once against the hosted database.

### API summary

| Method | Route                          | Who         | Purpose                          |
|--------|---------------------------------|-------------|-----------------------------------|
| POST   | /api/auth/register              | anyone      | Create account (donor/ngo/admin) |
| POST   | /api/auth/login                 | anyone      | Log in, returns JWT              |
| GET    | /api/auth/me                    | logged in   | Current user profile             |
| POST   | /api/donations                  | donor       | Post a donation                  |
| GET    | /api/donations/available?city=  | ngo         | Browse available donations       |
| GET    | /api/donations/mine             | donor / ngo | Own donations                    |
| GET    | /api/donations/:id/history       | logged in   | Status audit trail                |
| PATCH  | /api/donations/:id/accept       | ngo         | Accept a donation                |
| PATCH  | /api/donations/:id/complete     | ngo         | Mark picked up / completed       |
| PATCH  | /api/donations/:id/cancel       | donor       | Cancel while still available     |
| GET    | /api/admin/users?role=          | admin       | List users                       |
| PATCH  | /api/admin/users/:id/verify     | admin       | Verify an account                |
| DELETE | /api/admin/users/:id            | admin       | Remove an account                |
| GET    | /api/admin/donations?status=    | admin       | Monitor all donations            |
| GET    | /api/admin/stats                | admin       | Dashboard counters                |

## 2. Frontend setup

```bash
cd frontend
cp .env.example .env       # points at the backend URL
npm install
npm run dev                 # starts on http://localhost:5173
```

For a deployed frontend, set `VITE_API_URL` to the public backend URL ending
in `/api`, for example `https://api.example.com/api`, before building. If the
frontend and API share one origin, the production build can use `/api` without
setting this variable.

Pages: `/`, `/login`, `/register`, `/donor`, `/ngo`, `/admin` (each dashboard
route is protected and role-checked on the client — the backend also
enforces roles independently, so this isn't your only line of defense).

### Demo accounts

After running `npm run db:seed` from the project root, these verified accounts
and sample donation records are available:

| Role  | Email                    | Password               |
|-------|--------------------------|------------------------|
| Admin | admin@foodbridge.local   | FoodBridgeAdmin#2026   |
| Donor | donor@foodbridge.local   | FoodBridgeDonor#2026   |
| NGO   | ngo@foodbridge.local     | FoodBridgeNgo#2026     |

---

## Notes on what was deliberately left out (per the V1 scope you froze)

- **No transporter/volunteer role.** NGOs handle their own pickup.
- **No certificate generation.** Add it later as a plain acknowledgement
  record once the core loop is stable — don't imply official/government
  recognition without a real basis for it.
- **Admin accounts are not self-registrable** through the public registration
  flow. Create or seed admin accounts manually before deployment.
- **No email verification / password reset** — out of scope for V1 per your
  own module list.

## Suggested next steps

1. Run both servers, register one donor / one NGO / one admin, and walk the
   full happy path once end-to-end.
2. Compare this code against your frozen FR list — for anything not covered
   (e.g. FR-04's exact field list), adjust the schema/forms to match, not
   the other way around.
3. Only after that: revisit the ERD to make sure it still matches what you
   actually built, and finalize the SRS document from this working system.
