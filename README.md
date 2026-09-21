# ERP Dashboard – PPE Process 

An ERP / MES (Manufacturing Execution System) dashboard for managing a cable/panel ("cablage") production process. It covers production planning, panel tracking, stock and BOM management, purchasing, maintenance, technician training & certification, and the organizational chart, with a Node.js/Express + Prisma backend and a Next.js frontend.

## Tech Stack

**Backend**
- Node.js + Express
- Prisma ORM (MongoDB provider by default)
- JWT authentication, `bcryptjs` for password hashing
- `zod` for validation, `express-rate-limit` for rate limiting
- Jest + Supertest for testing

**Frontend**
- Next.js 16 (React 19)
- Tailwind CSS 4
- Chart.js / Recharts for KPI dashboards
- `@dnd-kit` for drag-and-drop planning boards
- `jspdf` / `xlsx-js-style` for PDF and Excel exports

## Project Structure

```
ERP-Dashboard-PPE-Process-main/
├── backend/
│   ├── src/
│   │   ├── app.js, index.js       # Express app entry points
│   │   ├── controllers/           # Route handlers (users, panneaux, stock, BOM, maintenance, ...)
│   │   ├── routes/                # Express route definitions
│   │   ├── middlewares/           # auth, role, rate limiting, error handling
│   │   ├── services/              # business logic (organigramme workflow, KPIs, permissions, ...)
│   │   ├── helpers/                # stock helpers, counters, AppError
│   │   └── config/db.js           # database connection
│   ├── prisma/                    # Prisma schema, migrations, seed script
│   ├── scripts/                   # utility scripts (e.g. switch to SQLite)
│   ├── tests/                     # Jest test suites
│   ├── docker-compose.yml         # local Postgres container (optional)
│   └── .env.example               # sample environment variables
└── frontend/
    ├── src/
    │   ├── app/                   # Next.js App Router pages (dashboard, planification, stock, bom,
    │   │                          #   panneaux, reservation, commande, maintenance, preventive,
    │   │                          #   formation, kpis, organigramme, techniciens, utilisateurs, ...)
    │   ├── components/            # shared layout/UI components
    │   └── lib/                   # API clients / utilities
    └── public/                    # static assets
```

## Core Modules

- **Dashboard & KPIs** – production and maintenance KPIs, charts, exports to PDF/Excel.
- **Planification** – production planning board with drag-and-drop scheduling.
- **Panneaux** – panel tracking: timeline, operators, checklists, defects, scrap, history.
- **Stock & Mouvements de stock** – inventory, stock locations, and stock movements.
- **BOM (Bill of Materials)** – BOM headers and lines linked to articles.
- **Réservation & Commande** – material reservations and purchase orders (with fournisseurs/suppliers).
- **Maintenance & Preventive Maintenance** – machines, interventions, spare parts, preventive checklists.
- **Formation / Certification** – training catalog, tests, badges, certifications, skills tracking.
- **Organigramme** – organizational chart with manager/subordinate hierarchy and approval workflow.
- **Utilisateurs & Auth** – user management, roles, audit log, JWT-based authentication.
- **KHM Control** – KHM quality control tracking.

## Getting Started

### Prerequisites
- Node.js (LTS recommended)
- A MongoDB instance (Prisma schema defaults to MongoDB) — or adapt to Postgres using the provided `docker-compose.yml` and `scripts/use-sqlite.js` for local/dev alternatives

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env   # then fill in DATABASE_URL, JWT_SECRET, etc.
npm run prisma:generate
npx prisma db push
npm run prisma:seed     # optional: seed sample data
npm run dev              # starts the API with nodemon
```

Environment variables (`backend/.env`):

| Variable       | Description                                  |
|----------------|-----------------------------------------------|
| `PORT`         | Port the API listens on (default `5000`)      |
| `DATABASE_URL` | MongoDB connection string                     |
| `JWT_SECRET`   | Secret used to sign JWTs                      |
| `CORS_ORIGIN`  | Allowed origin for the frontend (e.g. `http://localhost:3000`) |

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` by default and expects the backend API to be reachable (configured via `CORS_ORIGIN` on the backend and the API base URL in `frontend/src/lib`).

### Running Tests

> [!WARNING]
> **MongoDB Replica Set Required:** The testing environment and local transactional flows strictly require MongoDB to be configured as a Replica Set. Standard standalone MongoDB installations will block Prisma transactions, causing tests to fail or hang. If your local MongoDB is not a Replica Set, automated tests and multi-document transactions (e.g., Stock Allocation, Planification progress updates) will be blocked.

```bash
cd backend
npm test
```

### Production Deployment Readiness

- The frontend is fully statically optimizable using `npm run build` producing a production-ready Next.js bundle.
- Ensure the backend has a valid MongoDB Replica Set URI in the `DATABASE_URL`.
- Expose the required `.env` variables securely. Do NOT commit production credentials to `.env`.
- Backend logs errors to `console.error` and sanitizes response bodies to prevent stack trace leaks in non-development environments.

## Scripts Reference (backend)

| Script                  | Purpose                                   |
|--------------------------|--------------------------------------------|
| `npm start`               | Run the API in production mode            |
| `npm run dev`              | Run the API with auto-reload (nodemon)    |
| `npm test`                 | Run Jest test suite (requires Replica Set)|
| `npm run prisma:generate`  | Generate the Prisma client                |
| `npm run prisma:migrate`   | Run Prisma migrations                     |
| `npm run prisma:seed`      | Seed the database with sample data        |
| `npm run use-sqlite`       | Switch local setup to SQLite              |

## Backup Strategy

### MongoDB Backup
Recommended production strategy:
- Scheduled MongoDB backups.
- Retention policy configured based on business needs.
- Encrypted backup storage.
- Periodic restore verification.
(Note: Backup configuration depends heavily on the chosen MongoDB hosting provider such as MongoDB Atlas).

## Restore Procedure

1. Stop affected application services if necessary.
2. Identify the correct backup.
3. Restore into the target MongoDB environment.
4. Verify database integrity.
5. Verify Prisma/application connectivity.
6. Start backend.
7. Run health check.
8. Perform smoke tests.

## Rollback Strategy

1. Identify previous stable release.
2. Stop/deploy previous application version.
3. Restore compatible environment variables.
4. Verify database compatibility (Note: Database rollback is not automatically safe and may require a compatible migration/backup strategy).
5. Start backend/frontend.
6. Check `/health`.
7. Perform critical smoke tests.

## Known Limitations

- MongoDB Replica Set required for transactional runtime testing.
- E2E automation not implemented.
- OpenAPI/Swagger not implemented.
- React Query not implemented.
- Matricule → immutable ID migration deferred.

## Release Information

**ERP/MES Release Readiness**

**Status:** Code Verified / Runtime Blocked

**Completed:**
- P0 Security
- P1 Business Logic
- P2 Performance & Architecture
- P3 Quality & Production Readiness

**Known runtime limitation:**
MongoDB Replica Set required for transactional testing.

**Deployment prerequisite:**
Production MongoDB deployment must support transactions.
