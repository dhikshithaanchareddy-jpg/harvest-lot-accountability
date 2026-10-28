# Harvest Lot Freshness and Spoilage Accountability Register

> **A specialized agricultural supply-chain ledger and accountability register connecting field harvest, atmospheric cold-chain storage, periodic condition inspections, split/merge lineage, and outbound dispatch records to eliminate hidden and avoidable produce losses.**

---

## 1. Problem Solved

In agricultural supply chains and perishable food logistics, harvest records, cold-storage condition checks, dispatch manifests, and spoilage write-offs are typically siloed across disparate spreadsheets, paper clipboards, and disconnected ERP screens. This disconnection conceals avoidable losses, blurs operational accountability for thermal abuse, obscures shelf-life degradation, and breaks consumer traceability when batches are split or consolidated.

The **Harvest Lot Freshness and Spoilage Accountability Register** solves this problem by providing an integrated, end-to-end digital ledger where:
- Every harvest batch receives a unique traceable **Lot ID**.
- Storage atmospheric conditions (temperature, humidity, ethylene gas) are continuously audited against crop-specific **aging thresholds**.
- Batch genealogy is strictly maintained across **split and merge lineage events**.
- Dispatches record departure temperature custody and generate **bills of lading**.
- Spoilage write-offs enforce root-cause analysis, calculate immediate **financial loss impact**, and assign accountability to specific facilities.
- Comprehensive **loss rate analytics** track waste by crop variety, facility, and time period.
- A **Public Digital Passport** empowers retail buyers and consumers to verify origin and cold-chain compliance.

---

## 2. System Architecture & Tech Stack

This application strictly adheres to the mandated stack with no substituted frameworks or client libraries:

- **Frontend**: Semantic HTML5, custom CSS3 design system, and vanilla JavaScript only. No React, Vue, Angular, Bootstrap, or Tailwind.
- **Visual Design Identity**: Supply-chain ledger palette featuring warm pale cream (`#FAF7F0`), deep agricultural forest green (`#1B4332`), and mango orange (`#F77F00`) with custom lot identity badges, dynamic freshness meters, and interactive lineage provenance graphs.
- **Backend**: Node.js and Express.js REST API with modular architecture (controllers, services, validation middleware, RBAC enforcement, centralized error handling).
- **Database**: Supabase PostgreSQL for persistent data, featuring:
  - Normalized relational schema (`crops`, `storage_facilities`, `harvest_lots`, `lot_lineage`, `condition_checks`, `dispatches`, `spoilage_records`, `audit_events`, `system_users`).
  - Strict foreign keys, `CHECK` constraints, unique constraints, and optimized b-tree indexes.
  - Row Level Security (RLS) policies defining visitor, operator, and administrator access models.
  - Resilient hybrid database client supporting live remote Supabase cloud instances as well as a local schema persistence engine pre-seeded with synthetic demonstration data.

---

## 3. Project-Specific Features Implemented

| Feature | Description |
| :--- | :--- |
| **Unique Lot IDs & Barcodes** | Automated structured lot codes (`LOT-YYYYMMDD-CROP-SEQ`), initial grade classification, origin farm geo-tagging, and harvest block tracking. |
| **Atmospheric Condition Checks** | Multi-variable telemetry logging: temperature (°C), relative humidity (RH%), ethylene gas (ppm), visual quality score (0-100), and decay stage progression. |
| **Dynamic Aging Thresholds** | Real-time calculation of freshness index degradation based on crop shelf-life limits, thermal chilling/heat stress penalties, and pathogen observations. |
| **Split & Merge Lineage** | Batch splitting into multi-portion child lots with balance validation; multi-lot consolidation into unified batches with weighted freshness score preservation; interactive visual lineage tree. |
| **Outbound Chilled Dispatches** | Destination buyer manifests, distribution channel tiers, transport mode temperature limits, departure temperature logging, and bill of lading generation. |
| **Spoilage Accountability Register** | Mandatory reason codes (Fungal Rot, Over-Ripeness, Chilling Injury, Transit Crushing, Ethylene Decay, Compressor Failure), severity grading, automated dollar loss calculation, and facility attribution. |
| **Accountability Analytics** | Executive dashboard displaying: Loss Rate % by Crop Type, Spoilage Volume by Facility, Top Spoilage Drivers, and Net Inventory Valuation. |
| **Role-Based Access Control (RBAC)**| Granular access enforcement across **Visitor**, **Requester**, **Operator**, and **Administrator** roles with an interactive persona switcher in the navigation bar. |
| **Public Transparency Passport** | Open lookup endpoint (`/api/public/verify/:lotCode`) enabling consumers and auditors to inspect provenance and cold-chain compliance without login credentials. |

---

## 4. Database Schema & Migration Details

The PostgreSQL database schema is located in `supabase/migrations/20261028_001_initial_schema.sql` and includes:

1. `crops`: Crop catalog, optimal temperature and humidity ranges, shelf life days, critical aging thresholds, and base unit prices.
2. `storage_facilities`: Cold vaults, Controlled Atmosphere (CA) units, ripening rooms, and transit hubs with capacity and occupancy limits.
3. `harvest_lots`: Primary ledger entity tracking lot identity, crop variety, initial vs. current quantity, freshness score, aging status, and storage facility.
4. `lot_lineage`: Relational split and merge links binding parent lots to derived child lots with contribution quantities and operational rationales.
5. `condition_checks`: Time-series inspection telemetry capturing atmospheric sensors and quality scores.
6. `dispatches`: Outbound custody transfers, transport types, and carrier manifests.
7. `spoilage_records`: Loss write-offs with root cause analysis and corrective action requirements.
8. `audit_events`: Immutable security and operations audit trail for all create, update, split, merge, dispatch, and spoilage actions.
9. `system_users`: User personas and role authorizations.

---

## 5. Setup & Local Execution Guide

### Prerequisites
- Node.js (v18.x, v20.x, or v24.x recommended)
- npm (v9.x or higher)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

If connecting to a remote Supabase project, provide your credentials in `.env`:
```env
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DEMO_ROLE=operator
```
*(Note: If `SUPABASE_URL` is omitted, the application operates out of the box using its built-in PostgreSQL schema engine pre-seeded with synthetic demonstration data).*

### Step 3: Apply Database Migrations (Supabase Cloud)
1. Open your Supabase Dashboard -> **SQL Editor**.
2. Run the script in `supabase/migrations/20261028_001_initial_schema.sql`.
3. Run the synthetic seed script in `supabase/seed.sql`.

### Step 4: Run the Application
```bash
npm start
```
The server will start at `http://localhost:3000`.

### Step 5: Run Automated Tests
```bash
npm test
```

---

## 6. Verification & Test Results

The automated integration test suite (`tests/api.test.js`) verifies all 12 core requirements using Node.js's native test runner:

```
✔ 1. Health Check Endpoint returns 200 and healthy status (33.7ms)
✔ 2. Meta endpoints return seeded crops and facilities (4.9ms)
✔ 3. GET /api/lots returns lots with freshness scores and joined metadata (9.3ms)
✔ 4. POST /api/lots validates input and creates a new lot (12.9ms)
✔ 5. POST /api/condition-checks updates freshness score and degradation (3.3ms)
✔ 6. POST /api/lineage/split divides lot and establishes child records (3.4ms)
✔ 7. POST /api/lineage/merge merges compatible lots into single lot (4.1ms)
✔ 8. POST /api/dispatches validates stock and decreases inventory (2.8ms)
✔ 9. POST /api/spoilage accounts for financial loss and adjusts lot inventory (2.5ms)
✔ 10. GET /api/analytics/dashboard computes accountability metrics and loss rates (1.8ms)
✔ 11. GET /api/public/verify/:lotCode provides consumer traceability without auth (2.3ms)
✔ 12. Role-Based Access Control restricts unauthorized modifications for visitors (1.0ms)

ℹ tests 12 | pass 12 | fail 0 | cancelled 0 | duration_ms 365.9ms
```

---

## 7. Role Hierarchy & Personas

Switch personas dynamically using the dropdown in the top navigation bar:

1. **Dr. Elena Rostova** (`admin`) — Quality & Cold Chain Direction: Full administrative privileges across all facilities and records.
2. **Marcus Vance** (`operator`) — Cold Storage Logistics & QA: Induct lots, record telemetry inspections, split batches, and log dispatches.
3. **Carlos Mendoza** (`operator`) — Ripening & Packhouse Operations: Manage ripening chambers and log spoilage write-offs.
4. **Sophie Chen** (`requester`) — Supermarket Procurement: View available stock, verify passports, and request dispatches.
5. **Public Traceability Visitor** (`visitor`) — Read-only consumer view with access to the landing page and public digital passports.

---

## 8. Deployment Guidance

- **Production Node Hosting**: Deploy to Render, Railway, fly.io, or AWS ECS by pointing the start command to `npm start`.
- **Supabase Cloud**: Use the Supabase CLI (`supabase db push`) or the SQL Editor to apply migrations. Ensure environment variables `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured in your hosting provider's dashboard.
