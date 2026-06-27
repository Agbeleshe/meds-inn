# Meds-inn — AWS Migration Plan (Chat Catch-Up)

> **Use this file** at the start of a new chat: `@MIGRATION-PLAN.md`  
> Last updated: 2026-06-26

---

## Project summary

**Meds-inn** is a hospital-driven maternal care platform (React + Vite + TypeScript).  
**Goal:** Replace all demo data with live **AWS** data, one domain at a time, for a hackathon requiring **Vercel + AWS database**.

| Layer | Technology | Status |
|-------|------------|--------|
| Frontend | React 18, Vite, Tailwind, shadcn/ui | ✅ |
| Hosting | Vercel (`agbeleshes-projects/meds-inn`) | ✅ linked |
| API | Vercel Serverless `/api/*` | ⚠️ partial |
| Database | DynamoDB `meds-inn-db` (single table, PK/SK) | ✅ |
| AWS auth in API | Vercel OIDC → `@vercel/oidc-aws-credentials-provider` | ✅ |
| User auth | Supabase (`AuthContext`) | ⚠️ not Cognito yet |
| Demo data | `src/lib/demo-data.ts` + inline page constants | ⚠️ most pages still use this |

**Critical rule:** Browser never talks to AWS directly. All data goes through `/api/*` serverless routes.

---

## Architecture

```txt
Browser (http://127.0.0.1:5173)
    ↓ fetch /api/*
Vercel Serverless (api/*.ts)
    ↓ AWS SDK + OIDC credentials
DynamoDB table: meds-inn-db
    PK / SK composite keys (single-table design)
```

Future AWS services (not wired yet):
- **Cognito** — auth (Architecture page mentions it; code still uses Supabase)
- **S3** — document uploads
- **Bedrock** — AI care briefs (currently mock)
- **Chime SDK** — video (currently mock)
- **SES/SNS** — notifications

---

## What's already done (Phase 0 ✅)

- [x] Vercel project linked, `.env.local` pulled via `npm run vercel:env`
- [x] DynamoDB created in Vercel Storage (`meds-inn-db`, `us-east-1`, PK/SK)
- [x] AWS account linked (user's existing account with credits)
- [x] API client uses OIDC (no static AWS keys in frontend)
- [x] `POST /api/seed` — seeds mothers, appointments, team from `demo-data.ts`
- [x] `GET /api/mothers` — live DynamoDB read
- [x] **MothersPage** (`/dashboard/mothers`) — uses `useMothers()` hook, shows **Live · DynamoDB** badge when connected
- [x] `npm run dev` — runs app + API on **5173** (via `scripts/dev.mjs` → `vercel dev`)
- [x] Error handling — English `ErrorFallback` modal (replaced Chinese Medo/Sentry text)
- [x] Removed Medo/Miaoda branding from UI and config

---

## What's NOT done yet

- [ ] All pages except **Mothers** still use `demo-data.ts` or hardcoded constants
- [ ] `GET /api/appointments` exists but **AppointmentsPage not wired**
- [ ] Auth still **Supabase**, not Cognito; `AppContext` uses demo `ROLES` switcher
- [ ] No S3, Bedrock, or real video
- [ ] Mother profile hardcoded to `PATIENTS[0]`
- [ ] Create/update actions mostly toast-only (don't persist to AWS)

---

## Environment variables (`.env.local`)

Pulled from Vercel after connecting DynamoDB:

```txt
AWS_ACCOUNT_ID
AWS_REGION=us-east-1
AWS_RESOURCE_ARN
AWS_ROLE_ARN
DYNAMODB_TABLE_NAME=meds-inn-db
DYNAMODB_TABLE_PARTITION_KEY=PK
DYNAMODB_TABLE_SORT_KEY=SK
VERCEL_OIDC_TOKEN
```

Do **not** commit `.env.local`. Never use `VITE_` prefix for AWS secrets.

---

## Dev commands

```bash
npm run dev          # App + /api on http://127.0.0.1:5173 (USE THIS for AWS)
npm run dev:ui       # Vite only — demo data fallback, no /api
npm run vercel:env   # Refresh .env.local from Vercel
npm run vercel:login / vercel:link
npx vercel --prod    # Deploy for judges
```

**Verify AWS is working:**
```bash
curl http://127.0.0.1:5173/api/health
curl -X POST http://127.0.0.1:5173/api/seed
curl http://127.0.0.1:5173/api/mothers
```
Or: Dashboard → **Architecture** → **Seed demo data**, then **Mothers** → badge **Live · DynamoDB**.

---

## Key files

```txt
# Frontend
src/lib/demo-data.ts          # Demo source — TO BE REPLACED page by page
src/lib/api-client.ts         # fetchMothers, fetchHealth, seedDatabase, …
src/hooks/use-mothers.ts      # Pattern: API fetch + demo fallback
src/contexts/AuthContext.tsx  # Supabase auth (@meds-inn.health emails)
src/contexts/AppContext.tsx   # Demo ROLES switcher — needs /api/me
src/pages/MothersPage.tsx     # ✅ Only page on live DynamoDB
src/components/common/ErrorFallback.tsx

# API (server-only)
api/lib/dynamodb.ts           # OIDC client, TABLE_NAME, stripKeys
api/lib/items.ts              # PK/SK mappers (MOTHER#, APPOINTMENT#, TEAM#)
api/lib/handler.ts            # json(), methodNotAllowed()
api/mothers.ts                # GET /api/mothers
api/appointments.ts           # GET /api/appointments (not wired to UI)
api/seed.ts                   # POST /api/seed
api/health.ts                 # GET /api/health

# Config
vercel.json                   # devCommand: vite, no SPA rewrites (breaks dev if added)
scripts/dev.mjs               # Wrapper so npm run dev avoids vercel recursion
.env.local                    # gitignored
.env.example                  # Template

# Planning (detailed breakdowns)
tasks/00-current-state.md
tasks/01-aws-architecture.md
tasks/02-authentication.md
tasks/03-data-model.md
tasks/04-api-routes.md
tasks/05-migration-phases.md
tasks/06-page-by-page.md
```

---

## DynamoDB single-table design

Table: **`meds-inn-db`**

| PK | SK | entityType | Example |
|----|-----|------------|---------|
| `MOTHER#MED-ELR-24018` | `PROFILE` | MOTHER | Patient record |
| `APPOINTMENT#apt1` | `METADATA` | APPOINTMENT | Appointment |
| `TEAM#tm1` | `PROFILE` | TEAM | Team member |
| `USER#<uuid>` | `PROFILE` | USER | Staff/mother profile (planned) |
| `MEDICATION#med1` | `METADATA` | MEDICATION | (planned) |
| `CAREPLAN#<id>` | `METADATA` / `ITEM#n` | CAREPLAN | (planned) |
| `MESSAGE#msg1` | `METADATA` | MESSAGE | (planned) |
| `DOCUMENT#doc1` | `METADATA` | DOCUMENT | (planned, S3 key in attrs) |

Mappers live in `api/lib/items.ts`. List queries use Scan + `begins_with(PK, prefix)` for hackathon scale.

---

## API routes

| Route | Method | Status | Frontend consumer |
|-------|--------|--------|-------------------|
| `/api/health` | GET | ✅ | ArchitecturePage |
| `/api/seed` | POST | ✅ | ArchitecturePage |
| `/api/mothers` | GET | ✅ | `useMothers` → MothersPage |
| `/api/appointments` | GET | ✅ API only | ❌ not wired |
| `/api/mothers/:id` | GET | ❌ | MotherProfilePage |
| `/api/me` | GET | ❌ | Auth / AppContext |
| `/api/medications` | ❌ | ❌ | MedicationRemindersPage |
| `/api/team` | ❌ | ❌ | TeamPage (seed writes team, no GET route yet) |
| `/api/care-plans/:id` | ❌ | ❌ | CarePlansPage |
| `/api/messages` | ❌ | ❌ | MessagesPage |
| `/api/documents` | ❌ | ❌ | DocumentsPage |
| `/api/dashboard/metrics` | ❌ | ❌ | DashboardOverview |

Full list: `tasks/04-api-routes.md`

---

## Page migration status

| Page | Route | Data today | Priority |
|------|-------|------------|----------|
| MothersPage | `/dashboard/mothers` | **AWS ✅** | Done |
| MotherProfilePage | `/dashboard/mothers/:id` | Demo `PATIENTS[0]` | **High — next** |
| AppointmentsPage | `/dashboard/appointments` | Demo | High |
| MedicationRemindersPage | `/dashboard/medications` | Demo | High |
| DashboardOverview | `/dashboard` | Demo | High |
| TeamPage | `/dashboard/team` | Demo (seeded in DB) | Medium |
| CarePlansPage | `/dashboard/care-plans` | Inline constants | Medium |
| MessagesPage | `/dashboard/messages` | Demo | Medium |
| DocumentsPage | `/dashboard/documents` | Demo | Medium (+ S3) |
| AICareBriefsPage | `/dashboard/ai-briefs` | Demo + inline | Medium |
| AnalyticsPage | `/dashboard/analytics` | Demo | Medium |
| PregnancyTimelinePage | `/dashboard/pregnancy` | Demo | Medium |
| VideoConsultationsPage | `/dashboard/video` | Demo + mock | Low |
| MotherDashboardPage | mother route | Inline | Phase 7 |
| BabyCarePage | `/dashboard/baby` | Demo | Phase 7 |
| SettingsPage | `/dashboard/settings` | Local state | Phase 7 |
| LoginPage | `/login` | Demo ROLES + Supabase | Phase 2 |
| LandingPage | `/` | Static/marketing | No AWS needed |

Full map: `tasks/06-page-by-page.md`

---

## Migration phases (execution order)

### Phase 0 — Foundation ✅ DONE
Vercel, DynamoDB, seed, mothers list, dev on 5173.

### Phase 1 — Shared foundation ⬅️ DO NEXT
- [ ] `src/types/clinical.ts` — types out of demo-data
- [ ] Expand `api/lib/items.ts` for all entities
- [ ] `src/hooks/use-api-query.ts` — reusable fetch pattern
- [ ] `DataSourceBadge` component
- [ ] Expand seed for all entity types

### Phase 2 — Authentication
- [ ] `GET /api/me` — user profile from DynamoDB
- [ ] Wire `AppContext` + `LoginPage` to real role (not demo ROLES)
- [ ] RouteGuard: staff vs mother routes
- [ ] Later: migrate Supabase → Cognito

### Phase 3 — Core clinical data
- [x] 3.1 MothersPage
- [ ] 3.2 MotherProfilePage + `GET /api/mothers/:id`
- [ ] 3.3 AppointmentsPage + wire existing appointments API
- [ ] 3.4 MedicationRemindersPage
- [ ] 3.5 TeamPage + `GET /api/team`
- [ ] 3.6 DashboardOverview + metrics API

### Phase 4 — Care coordination
CarePlansPage, PregnancyTimelinePage, profile timeline.

### Phase 5 — Communication & files
MessagesPage, DocumentsPage (+ S3), labs.

### Phase 6 — Analytics & AI
AnalyticsPage, AICareBriefsPage (Bedrock), video mock.

### Phase 7 — Mother-facing app
MotherDashboardPage, BabyCarePage, SettingsPage persistence.

### Phase 8 — Cleanup
Remove demo-data imports, deploy prod, hackathon screenshots.

Details: `tasks/05-migration-phases.md`

---

## Standard pattern (repeat for each page)

1. Add PK/SK mapper in `api/lib/items.ts`
2. Create `api/<resource>.ts`
3. Add `fetchX()` in `src/lib/api-client.ts`
4. Create `src/hooks/useX.ts` (loading, error, source: demo | dynamodb)
5. Replace page imports from `demo-data.ts`
6. Wire create/update to API (not toast-only)
7. Test: `npm run dev` → seed → verify badge **Live · DynamoDB**

---

## Auth (current vs target)

**Current:**
- `AuthContext` → Supabase (`@/db/supabase`)
- Login: username → `{username}@meds-inn.health` + password
- `RouteGuard` checks Supabase session
- `AppContext` role = demo switcher (`ROLES` from demo-data)

**Target:**
- Cognito (hackathon story) OR interim: Supabase + sync user to DynamoDB `USER#`
- `GET /api/me` returns role, hospitalId, name
- Role-based access: admin, nurse, doctor, mother

Details: `tasks/02-authentication.md`

---

## Known issues & fixes applied

| Issue | Fix |
|-------|-----|
| `vercel` command not found | Installed locally; use `npm run vercel:*` or `npx vercel` |
| `vercel dev` recursive error | `scripts/dev.mjs` wrapper; `vercel.json` `devCommand: vite …` |
| App on 5173 but API on 3000 | `npm run dev` now runs both on 5173 |
| HTML parse error on dev | Removed catch-all SPA rewrite from `vercel.json` |
| Chinese error text | Replaced with `ErrorFallback.tsx` |
| `PATIENTS is not defined` on MothersPage | Fixed footer to use `allPatients.length` |
| Medo/Miaoda branding | Removed; images → Unsplash; package renamed `meds-inn` |

---

## Hackathon proof checklist

- [ ] Screenshot: Vercel Dashboard → Storage → `meds-inn-db` (Available)
- [ ] Screenshot: Mothers page with **Live · DynamoDB** badge
- [ ] Live URL: `npx vercel --prod`
- [ ] Architecture page shows connected + seed works

---

## Suggested next task for a new chat

> **"Implement Phase 1 + Phase 3.2: shared hooks/types and MotherProfilePage wired to `GET /api/mothers/:id`"**

Or pick one page from Phase 3 and follow the standard pattern above.

---

## Related docs

- `README.md` — setup & dev commands
- `tasks/` — detailed breakdowns per topic
- `.env.example` — env var template
