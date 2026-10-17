# 🍱 DabbaIQ — AI Kitchen Prep & Food-Waste Planner

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-16.4.1_(Turbopack)-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.4-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12%20%7C%203.13-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas_6.0%2B-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://cloud.mongodb.com/)
[![Open-Weight AI](https://img.shields.io/badge/Gemma_2%2F3-Ollama_Inference-blueviolet?style=for-the-badge&logo=google&logoColor=white)](https://ollama.ai/)
[![Test Suite](https://img.shields.io/badge/Pytest-101%2F101_PASSED-brightgreen?style=for-the-badge&logo=pytest&logoColor=white)](https://pytest.org/)
[![Deploy on Vercel](https://img.shields.io/badge/Vercel-Live_App-black?style=for-the-badge&logo=vercel&logoColor=white)](https://dabba-iq.vercel.app/)
[![Deploy on Render](https://img.shields.io/badge/Render-Backend_PaaS-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

### *"Cook the right amount. Waste less. Earn more."*

An enterprise-grade, open-weight AI kitchen operations desk built for Indian tiffin subscription services, cloud kitchens, and meal prep entrepreneurs. Designed from a **26-screen Google Stitch canvas**, pairing **deterministic demand forecasting** with **Gemma 3 open-weight reasoning**.

[🚀 Live Web App (Vercel)](https://dabba-iq.vercel.app/) • [🍱 3D Tiffin Experience](https://dabba-iq.vercel.app/experience) • [📐 Architecture](#-system-architecture) • [⚡ Quickstart](#-local-development-quickstart) • [☁️ Deployment](#-cloud-deployment-guide) • [🧪 101/101 Tests](#-verified-quality-gates--test-suite)

</div>

---

## 📑 Interactive Table of Contents

<details open>
<summary><b>Click to expand / collapse navigation</b></summary>

- [1. 💡 Problem Statement & Mission](#1--problem-statement--mission)
- [2. 🍱 The 26-Screen Stitch Experience & Route Tour](#2--the-26-screen-stitch-experience--route-tour)
- [3. 📐 System Architecture](#3--system-architecture)
- [4. 🧠 Deterministic Math vs. Open-Weight AI](#4--deterministic-math-vs-open-weight-ai)
- [5. ⚡ Local Development Quickstart](#5--local-development-quickstart)
- [6. ☁️ Cloud Deployment Guide (Vercel + Render)](#6--cloud-deployment-guide-vercel--render)
- [7. 🧪 Verified Quality Gates & 101/101 Test Suite](#7--verified-quality-gates--101101-test-suite)
- [8. 🔌 Partner & Enterprise Integrations](#8--partner--enterprise-integrations)
- [9. 🔒 Security & Zero Secret Leakage](#9--security--zero-secret-leakage)
- [10. 📜 License & Hacktoberfest 2026 Credits](#10--license--hacktoberfest-2026-credits)

</details>

---

## 1. 💡 Problem Statement & Mission

Small Indian tiffin services (*dabbawalas*), home-chef subscriptions, and independent commercial kitchens operate on knife-edge net margins (**10%–15%**). Every single operational morning, they face a dual risk dilemma:
1. **Over-preparation:** Cooking excess dal, subzi, rice, and chapatis destroys daily profits in spoiled leftovers.
2. **Under-preparation:** Running short turns away recurring subscription clients and damages client loyalty.

Conventional restaurant ERPs and POS systems demand steep subscription fees, complex bar-code scanners, and rigid corporate setups.

**DabbaIQ** solves this with a **Two-Tier Command & Workflow Deck**:
* **Deterministic Demand Engine:** Calculates exact portion needs using weekday historical observations (e.g. Wednesday lunch lookback) with trailing 7-day averages and transparent safety buffers (e.g. +15%).
* **Pure Python Cost Math:** Live ingredient conversion (`kg` ↔ `g`, `L` ↔ `ml`) and recipe portion costs are computed in verified code—**never hallucinated by an LLM**.
* **Gemma 3 Open-Weight Intelligence:** Local or cloud open-weight AI interprets messy handwritten notes, voice notes, and generates multi-lingual WhatsApp menus without subscription lock-in or proprietary data leakage.

---

## 2. 🍱 The 26-Screen Stitch Experience & Route Tour

DabbaIQ’s UI is implemented from Google Stitch project `1933848754259984407`, reconciling all 26 reported canvas screens into 12 production routes and an interactive 3D tiffin storyboard.

<details open>
<summary><b>🗺️ Expand to explore all 12 operational routes & UI modules</b></summary>

| Route | Primary Stitch Screen ID | Purpose & Key Features |
| :--- | :--- | :--- |
| **[`/`](frontend/app/page.tsx)** | `24fbaa3407634584b9a6ad7d611fedef` | **Kitchen Overview & Live Command Deck:** Shift telemetry bar, KPI cards (planned portions, recorded sales, revenue, low stock), Recharts 7-day trend chart, and Quick Sale modal. |
| **[`/experience`](frontend/app/experience/page.tsx)** | `f069e818f817440b965722d7f6a4b92c` | **Scroll-Driven 3D Tiffin Storyboard:** Interactive 6-stage physical separation scrubbing between high-res studio camera renders (`Z+85mm` CAD HUD, pressure release, steam vent). |
| **[`/planner`](frontend/app/planner/page.tsx)** | `4f9c41fc40b8421489fec7d702ac9f8a` | **AI Preparation Planner:** Deterministic baseline forecasting, safety buffers (+15%), auto-generated ingredient shortage shopping list, and Gemma note interpretation. |
| **[`/inventory`](frontend/app/inventory/page.tsx)** | `26090fa455db48858394eb8345a545a0` | **Inventory & Stock Desk:** Stock balances, unit tracking, reorder thresholds, expiring alerts, APMC mandi wholesale price search, and quick (+1, +5, -1) count adjustments. |
| **[`/recipes`](frontend/app/recipes/page.tsx)** | `27e0f6b927ed402ab8a28f54c52589c5` | **Recipe Library & Bill-of-Materials Costing:** Dynamic per-portion cost breakdown computed live from ingredient unit prices, plus multi-lingual marketing menu generator. |
| **[`/sales`](frontend/app/sales/page.tsx)** | `db3f41088ed9411fac9c081e984f796e` | **Sales Log & Dispatch Tracking:** Shift sales recording, meal periods (Lunch/Dinner), one-click Quick Sale modal, and full CSV template import/export. |
| **[`/waste`](frontend/app/waste/page.tsx)** | `96503c2f086940668c19ff94b6ec82e4` | **Food Loss & Waste Tracker:** Compares portions prepared vs. sold, calculates financial food loss in ₹, and identifies top waste-contributing dishes. |
| **[`/reports`](frontend/app/reports/page.tsx)** | `f389b60feb8d4975886e82f6b4f29546` | **Operations & Financial Audits:** Date-range financial rollups, estimated gross margins, meal-period summaries, and one-click CSV ledger downloads. |
| **[`/settings`](frontend/app/settings/page.tsx)** | `748291c6553945c2af153185ddc24bd9` | **System Health & Connectivity Desk:** Live diagnostic inspect of MongoDB Atlas, Ollama, SerpAPI, Tiger Data, Temporal, and ElevenLabs with copyable setup commands. |
| **[`/project-info`](frontend/app/project-info/page.tsx)** | Dedicated Arch Page | **Technical Specification & Architecture:** Complete 10-point technical evaluator specification, design system tokens, database schema breakdown, and partner API contracts. |
| **[`/privacy`](frontend/app/privacy/page.tsx)** | `34e5259746564bdd87b271de1d09162f` | **Data Protection Policy:** Indian Digital Personal Data Protection Act compliance and local AI data sovereignty commitments. |
| **[`/terms`](frontend/app/terms/page.tsx)** | `d87b787d49364a8aacc4a7534ef8f284` | **Operational License & Terms:** Software licensing, kitchen liability waivers, and commercial food safety compliance notices. |

</details>

---

## 3. 📐 System Architecture

DabbaIQ uses a strictly decoupled, micro-service ready architecture where client-side UI calls type-safe endpoints, and arithmetic calculations are strictly quarantined from probabilistic AI generation.

```mermaid
flowchart TB
    subgraph Frontend ["Frontend — Next.js 16.4.1 (Turbopack + Tailwind v4)"]
        Nav["Two-Tier Command Deck<br/>(10 Destinations + Telemetry)"]
        UI_Dash["Overview Dashboard (/)"]
        UI_Plan["AI Prep Planner (/planner)"]
        UI_Exp["3D Tiffin Storyboard (/experience)"]
        UI_Cost["Recipe Costing (/recipes)"]
        Client["Type-Safe API Client (lib/api.ts)"]

        Nav --> UI_Dash
        Nav --> UI_Plan
        Nav --> UI_Exp
        Nav --> UI_Cost
        UI_Dash --> Client
        UI_Plan --> Client
        UI_Cost --> Client
    end

    subgraph Backend ["Backend — FastAPI Python 3.12+ (Render Web Service)"]
        Router["FastAPI Application Router (/api)"]
        ForecastEngine["Deterministic Demand Engine<br/>(Weekday Matching + Safety Buffer)"]
        CostEngine["Pure Python Cost & Inventory Math<br/>(kg ↔ g, L ↔ ml conversions)"]
        AIClient["Open-Weight AI Provider<br/>(Gemma 2/3 Client)"]
        TemporalClient["Temporal Orchestrator Client"]

        Router --> ForecastEngine
        Router --> CostEngine
        Router --> AIClient
        Router --> TemporalClient
    end

    subgraph Data ["Persistent Storage & Partner Services"]
        Atlas[("MongoDB Atlas 6.0+<br/>(Primary Storage: Recipes, Inventory, Sales)")]
        Ollama["Ollama Server / Cloud GPU<br/>(Gemma 3:4b Model)"]
        Serp["SerpAPI Wholesale Engine<br/>(Vashi APMC Mandi Rates)"]
        Tiger[("Tiger Data / TimescaleDB<br/>(Commodity Volatility Hypertable)")]
        Temporal["Temporal Workflow Cluster<br/>(Synchronous In-Process Fallback)"]
    end

    Client -->|"HTTPS REST Calls (NEXT_PUBLIC_API_BASE_URL)"| Router
    ForecastEngine --> Atlas
    CostEngine --> Atlas
    AIClient -->|"POST /api/generate"| Ollama
    Router -->|"Search Mandi Benchmarks"| Serp
    Router -->|"Append Volatility Snapshots"| Tiger
    TemporalClient -->|"Async Workflows"| Temporal
```

---

## 4. 🧠 Deterministic Math vs. Open-Weight AI

A foundational design principle of DabbaIQ is **strict separation of concerns**:

| Operation | Executed By | Rationale |
| :--- | :--- | :--- |
| **Portion Forecasting** | Pure Python Algorithm | Takes 4 matching past weekdays (e.g. Wednesday lunch), applies trailing 7-day fallback, and adds configurable +15% safety buffer. Transparent and auditable. |
| **Recipe Portion Costing** | Pure Python Math | Sums `ingredient.cost_per_unit * recipe.quantity_per_portion` with exact unit conversion. Zero numerical hallucinations. |
| **Shortage Calculation** | Pure Python Math | Compares `required_quantity` vs. `stock_quantity`. Generates exact purchase quantities with estimated ₹ spend. |
| **Messy Kitchen Notes** | Gemma 3:4b (via Ollama) | Interprets informal notes (*"Sharma family wants 6 extra chapatis and no onion dal"*) into structured order candidates. |
| **WhatsApp Marketing** | Gemma 3:4b (via Ollama) | Generates enticing daily menu broadcasts in English, Hindi, and Marathi. |
| **Recipe Pairing Advisory** | Gemma 3:4b (via Ollama) | Analyzes existing recipes to suggest harmonious vegetable & lentil combinations. |

---

## 5. ⚡ Local Development Quickstart

### Prerequisites
* **Python 3.12+** ([python.org](https://www.python.org/))
* **Node.js 20+** & npm ([nodejs.org](https://nodejs.org/))
* *(Optional)* **Ollama** with `gemma3:4b` ([ollama.com](https://ollama.com/))

### 1. Clone the Repository
```bash
git clone https://github.com/AnshMeshram/DabbaIQ.git
cd DabbaIQ
```

### 2. Configure Backend
```bash
cd backend
cp .env.example .env
```
*(Optionally set `MONGODB_URI` in `backend/.env`. If omitted, DabbaIQ boots in safe in-memory demo mode).*

Install Python dependencies and run the automated test suite:
```bash
pip install -r requirements.txt
python -m pytest tests/ -v
```

Start the FastAPI ASGI server:
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
*API Swagger Documentation is available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).*

### 3. Configure Frontend
In a new terminal window:
```bash
cd frontend
cp .env.example .env.local
```
Install dependencies and launch the Turbopack development server:
```bash
npm install
npm run dev
```
*Open [http://localhost:3000](http://localhost:3000) in your browser.*

---

## 6. ☁️ Cloud Deployment Guide (Vercel + Render)

DabbaIQ is pre-configured for instant zero-downtime deployment using **Vercel** for the Next.js frontend and **Render** for the FastAPI backend.

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│     VERCEL (Next.js 16)         │ HTTPS │      RENDER (FastAPI Python)    │
│ Root: frontend                  ├──────►│ Root: backend                   │
│ Env: NEXT_PUBLIC_API_BASE_URL   │       │ Start: uvicorn app.main:app     │
└─────────────────────────────────┘       └────────────────┬────────────────┘
                                                           │
                                                  ┌────────▼────────┐
                                                  │  MongoDB Atlas  │
                                                  │ (Whitelist All) │
                                                  └─────────────────┘
```

<details>
<summary><b>Click to expand step-by-step cloud deployment settings</b></summary>

### Step 1: Render Backend Configuration
1. In the [Render Dashboard](https://dashboard.render.com/), create a new **Web Service**.
2. Connect your repository.
3. Configure settings:
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 4`
   - **Health Check Path:** `/api/health`
4. Set Environment Variables:
   - `APP_ENV`: `production`
   - `DEBUG`: `false`
   - `MONGODB_DATABASE`: `dabbaiq`
   - `MONGODB_URI`: `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority`
   - `FRONTEND_ORIGIN`: `https://dabba-iq.vercel.app`
   - `CORS_ORIGINS`: `https://dabba-iq.vercel.app,http://localhost:3000`

### Step 2: Vercel Frontend Configuration
1. In the [Vercel Dashboard](https://vercel.com/), click **Add New...** > **Project** and import this repository.
2. Configure settings:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Click "Edit" and choose `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
3. Add Environment Variable:
   - `NEXT_PUBLIC_API_BASE_URL`: `https://<your-render-service>.onrender.com/api`
   *(⚠️ Critical: Must include `/api` suffix and have NO trailing slash).*
4. Click **Deploy**.

### Step 3: MongoDB Atlas IP Access
In MongoDB Atlas > **Network Access** > **Add IP Address**, select **Allow Access from Anywhere (`0.0.0.0/0`)** to allow dynamic Render worker IPs to connect securely.

*Detailed guide available at [`docs/implementation/deployment-guide.md`](docs/implementation/deployment-guide.md).*

</details>

---

## 7. 🧪 Verified Quality Gates & 101/101 Test Suite

Every commit to DabbaIQ is verified against an extensive automated testing suite.

```bash
cd backend && python -m pytest tests -v
```

```
============================ 101 passed in 11.73s =============================
```

<details>
<summary><b>📋 Click to inspect test suite coverage breakdown</b></summary>

| Test Category | Tests | Description & Scenarios |
| :--- | :---: | :--- |
| **API Endpoints** | 38 | CRUD testing for Inventory, Recipes, Sales, Waste, Dashboard, Reports, Prep Plans, and Mandi search. |
| **API Contracts** | 3 | Verifies OpenAPI schema generation and that every frontend API route exists in FastAPI router. |
| **Unit Conversions** | 8 | Validates exact mathematical compatibility between `kg` ↔ `g` and `L` ↔ `ml`, rejecting invalid cross-unit conversions. |
| **Schema Validations** | 8 | Enforces Pydantic bounds: rejects negative quantities, empty names, zero-portion sales, and invalid dates. |
| **AI Validation & Parsing** | 9 | Tests extraction of valid JSON from markdown fences, recovery from noisy LLM preambles, and malformed response fallbacks. |
| **Demand Forecasting** | 3 | Validates sufficient matching weekday calculations, fallback to trailing 7-day moving average, and zero-history flags. |
| **Cost Math & Shortages** | 3 | Tests exact financial leftover loss calculations, bill-of-materials portion costing, and pantry shortage calculations. |
| **CSV Import & Export** | 4 | Rigorously tests CSV parsing, bad date rejects, invalid meal period rejects, and export generation. |
| **Integrations & Diagnostics** | 8 | Tests default configuration, CORS lists, live Atlas health pings, and graceful partner status reporting. |
| **SerpAPI & Mandi Scraper** | 4 | Tests rupee prefix parsing (`₹`, `Rs.`), currency detection, 401 auth handling, and 429 quota exhaustion fallbacks. |
| **Tiger Data TimescaleDB** | 2 | Tests hypertable availability checks and graceful unconfigured returns. |
| **Temporal Workflows** | 3 | Tests workflow trigger fallbacks, offline result retrieval, and baseline demand computation activities. |
| **Database Seeding** | 2 | Tests idempotency and duplicate-safe seeding guards. |

</details>

---

## 8. 🔌 Partner & Enterprise Integrations

DabbaIQ features robust first-class and partner integrations with **graceful offline fallbacks**:

| Integration | Technology | Purpose | Fallback Behavior if Offline |
| :--- | :--- | :--- | :--- |
| **MongoDB Atlas** | Motor AsyncIO / PyMongo | Primary cloud document persistence | Safe in-memory demo mode (`is_demo: true`) |
| **Open-Weight AI** | Ollama / Gemma 3:4b | Notes parsing, menu generation | Deterministic 7-day weighted moving averages |
| **Mandi Price Index** | SerpAPI Wholesale Scraper | Live Vashi APMC wholesale prices | Cached mandi benchmarks & ingredient costs |
| **Time-Series Storage**| Tiger Data (TimescaleDB) | Price snapshot volatility hypertable | Gracefully skips writes with status `unconfigured` |
| **Workflow Engine** | Temporal Orchestrator | Distributed kitchen preparation workflows | Executes workflows synchronously in-process |
| **Voice Notes** | ElevenLabs Speech-to-Text | Transcribing vocal kitchen notes | Displays "Integration not configured" indicator |

---

## 9. 🔒 Security & Zero Secret Leakage

* **Strict `.gitignore` Enforcement:** All `.env`, `.env.local`, `.env.*`, and private credentials (`*.pem`, `*.key`) are completely barred from Git tracking.
* **Client-Side Shielding:** Only variables explicitly prefixed with `NEXT_PUBLIC_` (`NEXT_PUBLIC_API_BASE_URL`) are exposed to client browsers.
* **Server-Side Credentials:** `MONGODB_URI`, `SERPAPI_API_KEY`, and partner tokens reside strictly within Render’s server environment and are never returned in JSON payloads.
* **Diagnostic Obfuscation:** The `/api/health` and `/api/integrations/status` endpoints report connectivity states and latencies without leaking passwords, tokens, or usernames.

---

## 10. 📜 License & Hacktoberfest 2026 Credits

* **License:** Distributed under the [MIT License](LICENSE).
* **Challenge:** Built for **Hacktoberfest 2026: DEV Open-Source AI Challenge, Week 2 (Side Hustle)**.
* **Design Canvas:** Based on Google Stitch Project `1933848754259984407` (*DabbaIQ: Inside The Dabba*).
* **Author:** Built with ❤️ for independent tiffin entrepreneurs.
