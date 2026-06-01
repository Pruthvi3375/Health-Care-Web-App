# HealthCore EMS — Automation Playground

A medium-sized React + TypeScript healthcare management frontend built for validating AI-powered Playwright automation: locator intelligence, semantic mapping, test generation, and self-healing.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- React Router, React Hook Form, Zod
- Mock API (localStorage-backed, deterministic seed data)

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and sign in with a demo account.

## Demo accounts

| Role      | Email                      | Password       |
|-----------|----------------------------|----------------|
| Admin     | admin@healthcore.demo      | Admin123!      |
| Scheduler | scheduler@healthcore.demo  | Schedule123!   |
| Billing   | billing@healthcore.demo    | Billing123!    |

## Modules

- **Authentication** — login, session, role-based route guards
- **Dashboard** — operational stats
- **Patients** — full CRUD with search, filter, sort, pagination
- **Providers** — create/edit directory
- **Appointments** — scheduling with conflict validation
- **Claims** — status review workflow
- **Uploads** — file upload with validation (PDF/PNG/JPEG, 5MB max)
- **Toasts** — global notifications
- **Chaos Mode** — controlled UI drift for self-healing tests

## Automation support

- Stable `data-testid` on interactive elements (`src/testids/index.ts`)
- Route manifest: `/public/automation-manifest.json`
- Programmatic manifest: `src/automation/manifest.ts`

### Chaos mode (header toggle)

When enabled, optionally simulate:

- **Locator remapping** — swaps known test IDs (e.g. `auth-login-submit` → `auth-sign-in-btn`)
- **Label changes** — alternate visible labels
- **DOM restructuring** — reorders/wraps form and table markup
- **Missing test IDs** — strips `data-testid` from chaos-aware components
- **Dynamic rendering** — 800ms delayed content mount

## Reset mock data

Clear `localStorage` key `healthcore-mock-db` or use browser devtools to reset to seed data.

## Build

```bash
npm run build
npm run preview
```
