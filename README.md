# ZLMS — Zamtel Liquidity Management System

> *Create Your World* — A GPS-verified, QR/OTP-confirmed liquidity distribution platform for Zamtel Money agents.

## Overview

ZLMS bridges the gap between cash distribution and usage verification:

1. **GPS-verified handshake** — rebalancer must be within 100m of agent to dispense
2. **QR + OTP confirmation** — dual-factor verification at point of dispense
3. **Burn-down tracking** — monitors how fast dispensed float is used (72h target)
4. **LUR (Liquidity Utilization Ratio)** — determines agent eligibility for future rebalancing
5. **Two integration modes** — Standalone (no Core) or Integrated (Tier 1 CSV / Tier 3 Webhook)

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + TailwindCSS + Vite PWA |
| Backend | Node.js + Express + TypeScript + Prisma |
| Database | SQLite (dev) / PostgreSQL (production) |
| Maps | Leaflet + react-leaflet (NO Google Maps) |
| Auth | JWT + bcrypt PIN |
| State | Zustand |
| Charts | Recharts |

---

## Quick Start

### Prerequisites
- Node.js 20+
- npm 10+

### 1. Clone and setup

```bash
git clone <repo>
cd Rebalancer-Tracker
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET

npm install
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts    # Seeds 20 Lusaka agents
npm run dev                    # Starts on port 3001
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev   # Starts on port 5173
```

### 4. Login

| Role | Phone | PIN |
|------|-------|-----|
| Super Admin | 0970000001 | 123456 |
| TDE | 0970000002 | 123456 |
| Master Agent | 0970000010 | 123456 |
| Rebalancer | 0970000020 | 123456 |

---

## Integration Modes

Set `INTEGRATION_MODE` env variable in `backend/.env`:

### Standalone (Tier 0) — `standalone`
- ✅ GPS verification, QR scan, OTP dispense
- ✅ Audit trail, route management, observation reports
- ✅ CAS score (from TRN submissions + observations)
- ❌ LUR shown as "Pending Core Integration"
- ❌ Burn-down tracking (no Core transaction data)
- ❌ Commission calculation disabled

**Banner**: Orange `⚠️ Standalone Mode`

### Batch Mode (Tier 1) — `tier1`
- ✅ Everything in Standalone
- ✅ LUR calculation from daily CSV import
- ✅ Burn-down tracking
- ✅ Commission calculation
- Upload CSV at **Admin → Integration**

**Banner**: Yellow `📦 Batch Mode`

CSV format: `msisdn,amount,type,ref,timestamp`

### Live Integration (Tier 3) — `tier3`
- ✅ Everything in Tier 1
- ✅ Real-time Core webhook
- ✅ Fraud detection

**Banner**: Green `✅ Live Integration`

Webhook endpoint: `POST /api/v1/transactions/sync`
Header: `X-Webhook-Secret: <your-secret>`
Body: `{ "transactions": [{ "msisdn": "...", "amount": 1000, "type": "CASH_IN", "txnRef": "...", "timestamp": "..." }] }`

---

## Docker Compose (Production)

```bash
cp backend/.env.example backend/.env
# Set JWT_SECRET, WEBHOOK_SECRET, INTEGRATION_MODE

docker compose up -d
```

Services:
- `db` — PostgreSQL 16 on port 5432
- `backend` — Express API on port 3001
- `frontend` — nginx serving React PWA on port 80

---

## Architecture

```
Rebalancer-Tracker/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Full DB schema
│   │   └── seed.ts            # 20 Lusaka agents + test data
│   └── src/
│       ├── index.ts           # Express app entry
│       ├── middleware/        # auth, errorHandler, logger
│       ├── routes/            # auth, agents, rebalance, reports, trn, burndown, commissions, admin
│       └── utils/             # haversine, otp, prisma
├── frontend/
│   └── src/
│       ├── App.tsx            # React Router
│       ├── components/
│       │   ├── layout/        # AppLayout, IntegrationBanner
│       │   ├── map/           # GeofenceMap, RouteMap (Leaflet)
│       │   └── ui/            # LurBadge, KpiCard, BurnAlert
│       ├── pages/
│       │   ├── admin/         # Dashboard, Agents, Integration, Commissions, Config
│       │   ├── tde/           # Dashboard, AgentsList, AgentDetail
│       │   ├── ma/            # Dashboard, Commission, Disputes
│       │   └── rebalancer/    # Home, Route, AgentVisit, Scan, Dispense, OTP, Receipt, History
│       └── store/             # Zustand auth store
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## Geofencing & Serviced Areas

The Leaflet map shows **100m geofence circles** around each agent:

| Colour | Condition |
|--------|-----------|
| 🟢 Green | LUR ≥ 80% or CAS ≥ 80 |
| 🟡 Amber | LUR 50-79% or CAS 50-79 |
| 🟠 Orange | LUR 30-49% or CAS 30-49 |
| 🔴 Red | LUR < 30% or flagged/locked |
| 🔵 Blue | Standalone mode — visited, LUR unknown |
| ⚫ Grey | Not yet serviced |

Click any circle to see agent details popup.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Phone + PIN login |
| GET | `/api/v1/auth/me` | Current user |
| GET | `/api/v1/auth/integration-mode` | Current mode |
| GET | `/api/v1/agents` | List agents (filters: status, search) |
| GET | `/api/v1/agents/:id` | Agent detail |
| GET | `/api/v1/agents/:id/score` | LUR + eligibility |
| PATCH | `/api/v1/agents/:id/status` | Update status/lock |
| POST | `/api/v1/rebalance/scan-agent` | QR + geofence check |
| POST | `/api/v1/rebalance/initiate` | Create request + send OTP |
| POST | `/api/v1/rebalance/confirm-dispense` | OTP verify + burn-down |
| GET | `/api/v1/reports/heatmap` | Geofenced serviced areas |
| GET | `/api/v1/reports/dashboard` | KPI summary |
| POST | `/api/v1/transactions/sync` | Tier 3 Core webhook |
| POST | `/api/v1/trn/submit` | Agent TRN submission |
| POST | `/api/v1/trn/batch-validate` | Tier 1 CSV import |
| GET | `/api/v1/burndown` | All burn-down trackers |
| GET | `/api/v1/burndown/:txnId` | Single tracker |
| POST | `/api/v1/commissions/generate` | Calculate commissions |
| PATCH | `/api/v1/commissions/:id/approve` | Approve commission |
| GET | `/api/v1/admin/config` | System config |
| PATCH | `/api/v1/admin/config` | Update config |
| GET | `/api/v1/admin/integration-status` | Feature matrix |

---

## Branding

- **Primary Green**: `#00843D`
- **Accent Pink**: `#E4007C`
- **App Name**: ZLMS — Zamtel Liquidity Management System
- **Tagline**: *Create Your World*
- Mobile-first for Rebalancer role, desktop-first for TDE/Admin/MA

---

## Contributing

1. Fork and create feature branch
2. `npm run build` must pass in both `backend/` and `frontend/`
3. TypeScript strict mode — no `any`
4. Submit PR against `develop`
