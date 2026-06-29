# Meds-inn

Hospital-driven maternal and child-care coordination platform.

**AWS migration plan (chat catch-up):** [`MIGRATION-PLAN.md`](./MIGRATION-PLAN.md)

## Tech Stack

Vite, TypeScript, React, Supabase

## Getting Started

### Requirements

- Node.js ≥ 20
- npm ≥ 10

### Setup

```bash
npm install
npm run dev
```

Open **http://127.0.0.1:5173/** — runs Vite and `/api` routes (DynamoDB) together.

(Vercel blocks putting `vercel dev` directly in the `dev` script, so a small wrapper in `scripts/dev.mjs` starts it.)

Use `npm run dev:ui` for UI-only with built-in demo data (no AWS).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | App + DynamoDB API at **http://127.0.0.1:5173** |
| `npm run dev:ui` | UI only at 5173 (no AWS; uses built-in demo data) |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run type-check, lint, and build validation |

## Hackathon: Vercel + AWS (DynamoDB)

This project is **Vite + React**, not Next.js. The architecture is the same for judges:

```txt
Cursor → React/Vite code
Vercel → deployment + env vars + serverless API routes
AWS → DynamoDB (via Vercel Storage integration)
```

**Important:** DynamoDB credentials stay on the server. The browser calls `/api/*` routes; it never talks to AWS directly.

### 1. Link to Vercel (in Cursor terminal)

Vercel is installed **locally** in this project (no global install needed):

```bash
npm run vercel:login
npm run vercel:link
```

Or use `npx vercel login` and `npx vercel link` directly.

### 2. Create DynamoDB in Vercel

Vercel Dashboard → your project → **Storage** → create/connect **DynamoDB**.

Uses Vercel OIDC + single table `meds-inn-db` with `PK` / `SK` keys.

### 3. Pull env vars into Cursor

```bash
npm run vercel:env
```

Copy `.env.example` for reference. **Do not commit `.env.local`** (already gitignored via `*.local`).

### 4. Run locally with API routes

```bash
npm install
npm run dev
```

Use `npm run dev` — not `dev:ui` — when testing DynamoDB locally.

### 5. Optional AWS CLI (separate account for S3, Bedrock, etc.)

```bash
aws configure --profile meds-in
export AWS_PROFILE=meds-in
aws sts get-caller-identity
```

Use the **Vercel integration account** for DynamoDB. Use your own AWS account for S3, Bedrock, SES/SNS, Chime if needed.

### Project layout

```txt
api/lib/dynamodb.ts   — server-side DynamoDB client
api/mothers.ts        — GET /api/mothers
api/appointments.ts   — GET /api/appointments
api/seed.ts           — POST /api/seed (load demo data)
api/health.ts         — GET /api/health
src/lib/api-client.ts — browser fetch helper
src/hooks/use-mothers.ts — DynamoDB with demo fallback
vercel.json           — SPA routing + API passthrough
```

### Seed demo data (after DynamoDB is connected)

```bash
curl -X POST http://localhost:3000/api/seed
```

Or use the **Seed demo data** button on Dashboard → Architecture.

## Project Structure

```
├── public/          Static assets
├── src/
│   ├── components/  UI and layout components
│   ├── contexts/    React context providers
│   ├── lib/         Utilities and shared data
│   ├── pages/       Route pages
│   ├── App.tsx      App shell and routing
│   └── main.tsx     Entry point
└── vite.config.ts   Vite configuration
```

push

and that is done.
tested
