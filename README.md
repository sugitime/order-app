# QM Order App

Multi-department Amazon order request system for Quality Management (QM).

## Features

### Public order form (no login)
1. **Your info** — Name and department
2. **Disclaimer** — Storage policy acknowledgment (required checkbox)
3. **Line items** — Description, Amazon URL (Amazon-only), quantity, and justification

### Admin backend (login required)
- **Orders** — Review each line item; approve or deny individually
- **Order queue** — Approved items auto-order via Amazon API (or manual entry)
- **Users** — Create admin and approver accounts (admin only)
- **Settings** — Gmail SMTP and Amazon API configuration (admin only)

## Quick start (Docker — recommended)

### Prerequisites
- Docker Desktop

### Run locally

```bash
docker compose up --build
```

Open [http://localhost:3000/order](http://localhost:3000/order) for the public form.

Admin login: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

Default credentials: `admin@example.com` / `changeme123`

Stop with `docker compose down` (add `-v` to reset the database).

## Quick start (without Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL

```bash
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL and AUTH_SECRET

npx prisma db push
npm run db:seed
npm run dev
```

## Gmail setup

1. Enable 2-Step Verification on the Gmail account
2. Create an [App Password](https://myaccount.google.com/apppasswords)
3. In **Admin → Settings**, enter the Gmail address and app password
4. Send a test email to verify

## Amazon auto-ordering

Amazon does not offer a public consumer checkout API. Options:

1. **Amazon Business Purchasing API** — Requires an Amazon Business account with API access. Configure credentials in Admin → Settings; extend `src/lib/amazon.ts` with your integration.
2. **Manual entry** — Use "Enter manually" in the Order Queue to record Amazon order ID and tracking number.
3. **Simulation** — With API enabled but placeholder credentials, the system generates simulated order IDs for testing.

## Deploy to Render (production)

1. Push this repo to GitHub
2. In [Render](https://render.com) → **New** → **Blueprint**
3. Connect the repo — Render reads `render.yaml` and creates:
   - PostgreSQL database (`order-app-db`)
   - Docker web service (`order-app`)
4. Set these environment variables when prompted:
   - `APP_URL` — your Render service URL (e.g. `https://order-app.onrender.com`)
   - `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — initial admin credentials
5. After the first successful deploy, set `RUN_SEED` to `false` if you do not want seed to run on every restart

## Project structure

```
src/
  app/
    order/          # Public multi-step form
    admin/          # Protected admin dashboard
    api/            # REST API routes
  components/       # UI components
  lib/              # Auth, email, Amazon, Prisma helpers
prisma/
  schema.prisma     # Database schema
  seed.ts           # Departments + default admin
```