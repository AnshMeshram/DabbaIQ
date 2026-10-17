# DabbaIQ — Route & API Endpoint Mapping

This document provides the authoritative, source-verified mapping between Next.js frontend routes and the active FastAPI backend endpoints. All endpoints use the established `/api/...` prefix.

---

## Operational Route Map

### 1. Dashboard (`/`)
- **Stitch Screens**: Desktop `24fbaa3407634584b9a6ad7d611fedef`, Mobile `adcae1e6e17b47d5b78d1c16bc62b9a5`
- **Frontend File**: `frontend/app/page.tsx`
- **Backend Endpoints**:
  - `GET /api/dashboard/today`: Returns current shift summary, expected portions, sales capacity line, live alerts, and low stock warnings.
  - `GET /api/inventory`: Supplies low stock threshold counts.
  - `GET /api/sales`: Supplies recent transactions for physical ticket ledger.
  - `POST /api/sales`: Triggered by `QuickSaleModal.tsx` for immediate order logging.

### 2. Inside the Dabba Experience (`/experience`)
- **Stitch Screens**: Cover `f069e818...`, Experience `b32ed781...`, Storyboard 01-06 (`317577...`, `c9fdd2...`, `32062f...`, `595675...`, `b8cd18...`, `72d612...`)
- **Frontend File**: `frontend/app/experience/page.tsx`
- **Backend Endpoints**:
  - `GET /api/plans`: Reads active daily plan for dynamic buffer portion preview.
  - `GET /api/recipes`: Pulls live portion costs for the 4-tier exploded dossier.
  - Local Assets: Uses verified Stitch studio photography assets (`/stitch/state-01-closed.png`, `/stitch/state-02-lid-lifting.png`, `/stitch/state-03-separating.png`, `/stitch/state-04-exploded.png`, `/stitch/state-dishes-bowl.png`).

### 3. AI Preparation Planner (`/planner`)
- **Stitch Screens**: Desktop `4f9c41fc40b8421489fec7d702ac9f8a`, Mobile `296c310af1cc4fc3b1fcdcc18b31c047`, Editorial `f4513a8d28d74149a8c15a757a6b8d03`
- **Frontend File**: `frontend/app/planner/page.tsx`
- **Backend Endpoints**:
  - `GET /api/plans`: Retrieves existing preparation plans for the selected date.
  - `POST /api/plans/generate`: Invokes forecasting and Gemma 2 reasoning with weather and historical traffic inputs.
  - `POST /api/plans/{id}/confirm`: Locks the prep plan into a physical kitchen ticket.
  - `POST /api/temporal/start-prep-flow`: Triggers the end-to-end Temporal preparation pipeline.

### 4. Inventory & Stock Ledger (`/inventory`)
- **Stitch Screens**: Desktop `26090fa455db48858394eb8345a545a0`, Editorial `c40c8e79fa3b4799a6bd83d5d57732e9`
- **Frontend File**: `frontend/app/inventory/page.tsx`
- **Backend Endpoints**:
  - `GET /api/inventory`: Fetches ingredient catalog with quantity, reorder level, unit cost, and expiry.
  - `POST /api/inventory/adjust`: Updates on-hand quantities with reason logging.
  - `GET /api/inventory/{ingredient_id}/price-history`: Fetches TimescaleDB price volatility time-series.
  - `GET /api/suppliers/benchmark`: Fetches SerpAPI Google Shopping wholesale mandi price benchmarks.

### 5. Recipe Library & Costing Matrix (`/recipes`)
- **Stitch Screens**: Costing Desk `27e0f6b927ed402ab8a28f54c52589c5`, Editorial Story `22576da8e5654a12bebde9b6eed7b95d`
- **Frontend File**: `frontend/app/recipes/page.tsx`
- **Backend Endpoints**:
  - `GET /api/recipes`: Lists master recipes with BOM ingredients and estimated plate costs.
  - `POST /api/recipes`: Adds a new master recipe with component ingredients.
  - `GET /api/recipes/{recipe_id}/cost`: Dynamic real-time recalculation of BOM portion cost based on current raw commodity inventory prices.
  - `POST /api/recipes/story`: Prompts Ollama Gemma 2 for culinary backstory and marketing descriptions in EN, HI, MR, and GU.

### 6. Sales Log (`/sales`)
- **Stitch Screens**: Desktop `db3f41088ed9411fac9c081e984f796e`, Editorial `5283dd1b33ac48fb9c0601626c2e86bc`
- **Frontend File**: `frontend/app/sales/page.tsx`
- **Backend Endpoints**:
  - `GET /api/sales`: Queries sales transactions filtered by date range and meal period.
  - `POST /api/sales`: Records new sales for individual recipes and meal periods.
  - `POST /api/sales/import`: Bulk uploads sales records via CSV.
  - `GET /api/sales/export`: Streams CSV export of logged sales records.

### 7. Waste Tracker & Food Loss Intelligence (`/waste`)
- **Stitch Screens**: Desktop `96503c2f086940668c19ff94b6ec82e4`, Editorial `ed7133b37d254222b716574fbf39f22d`
- **Frontend File**: `frontend/app/waste/page.tsx`
- **Backend Endpoints**:
  - `GET /api/waste`: Retrieves food loss logs with scrap cost and categorization.
  - `POST /api/waste`: Records shift leftover portions and estimated sunk food cost.
  - `DELETE /api/waste/{id}`: Deletes or archives erroneous scrap entries.
  - `GET /api/waste/export`: Streams CSV export of food loss data.

### 8. Business & Operations Reports (`/reports`)
- **Stitch Screens**: Desktop `f389b60feb8d4975886e82f6b4f29546`
- **Frontend File**: `frontend/app/reports/page.tsx`
- **Backend Endpoints**:
  - `GET /api/reports/summary?start_date=...&end_date=...`: Aggregates total revenue, ingredient cost, scrap loss, and gross profit margin.
  - `GET /api/reports/export`: Streams CSV export of full period financial and operational rollups.

### 9. Settings & System Health (`/settings`)
- **Stitch Screens**: Desktop `748291c6553945c2af153185ddc24bd9`
- **Frontend File**: `frontend/app/settings/page.tsx`
- **Backend Endpoints**:
  - `GET /api/health`: Core connectivity status for MongoDB Atlas, Tiger Data, SerpAPI, and Temporal.
  - `GET /api/integrations/status`: Detailed telemetry across all 8 integrated services (DB, Tiger, SerpAPI, Temporal, AI, ElevenLabs, Backboard, Tinker).
  - `GET /api/ai/status`: Reports Ollama host status and active Gemma model.

### 10. Privacy Policy (`/privacy`)
- **Stitch Screens**: Desktop `34e5259746564bdd87b271de1d09162f`
- **Frontend File**: `frontend/app/privacy/page.tsx`
- **Content**: Statutory compliance with India Digital Personal Data Protection (DPDP) Act 2023, local-first on-premise AI processing guarantee, and kitchen operations telemetry boundaries.

### 11. Terms of Service (`/terms`)
- **Stitch Screens**: Desktop `d87b787d49364a8aacc4a7534ef8f284`
- **Frontend File**: `frontend/app/terms/page.tsx`
- **Content**: Commercial Kitchen Operations License, automated forecasting disclaimer, and emergency offline operational protocols.

### 12. Project Information & Architecture (`/project-info`)
- **Frontend File**: `frontend/app/project-info/page.tsx`
- **Content**: Technical documentation for developers and evaluators: system architecture, data flow diagrams, verified technology stack, environment variables reference, and local setup commands.
