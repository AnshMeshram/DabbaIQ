# DabbaIQ — Production Deployment Guide

**Application:** DabbaIQ Master Kitchen Operations Desk  
**Target Architecture:** Decoupled Cloud PaaS — **Vercel** (Next.js 16 Frontend) + **Render** (FastAPI Python Backend) + **MongoDB Atlas** (Primary Database)  
**Version:** v2.4-BETA Release Candidate (RC-1)  
**Audit Verification Date:** October 17, 2026

---

## 1. Verified Architecture & Prerequisites

The DabbaIQ codebase has been verified against automated tests (101/101 passed) and Turbopack production compilation (15/15 static and dynamic routes compiled with 0 errors).

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Client Browser / Mobile                       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        VERCEL (Next.js 16.4 App Router)                 │
│  - Root Directory: frontend                                             │
│  - Client-side fetch via: NEXT_PUBLIC_API_BASE_URL                      │
│  - Public Domain: https://<your-app>.vercel.app                         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / CORS REST API Calls
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        RENDER (FastAPI / Uvicorn Web Service)           │
│  - Root Directory: backend                                              │
│  - Runtime: Python 3.12+ (requirements.txt)                             │
│  - Port Binding: $PORT (assigned dynamically by Render)                 │
│  - Public Domain: https://<your-service>.onrender.com                   │
│  - Health Check: /api/health                                            │
└──────────────┬─────────────────────┬──────────────────────┬─────────────┘
               │                     │                      │
               ▼                     ▼                      ▼
┌───────────────────────────┐ ┌──────────────┐ ┌─────────────────────────┐
│       MongoDB Atlas       │ │ Local/Cloud  │ │ Optional Integrations   │
│ - MONGODB_URI (ReplicaSet)│ │ AI Inference │ │ - SerpAPI (Mandi rates) │
│ - Whitelist: 0.0.0.0/0    │ │ - Ollama/    │ │ - Tiger Data (Timescale)│
│ - Database: dabbaiq       │ │   Gemma 2/3  │ │ - Temporal (Workflows)  │
│                           │ │ (Fallback to │ │ - ElevenLabs (Voice)    │
│                           │ │  deterministic│ │                         │
│                           │ │  forecasting)│ │                         │
└───────────────────────────┘ └──────────────┘ └─────────────────────────┘
```

---

## 2. Step 1: MongoDB Atlas Configuration (Prerequisite)

Before deploying the backend to Render, prepare your MongoDB Atlas cluster:

1. **Create/Open Cluster:** Create a free M0 cluster or use an existing cluster in MongoDB Atlas.
2. **Create Database User:**
   - In **Database Access**, create a user (e.g. `dabbaiq_user`) with `Read and write to any database` privileges.
   - Use a strong password without special URI-breaking characters (or URL-encode characters like `@`, `:`, `/`).
3. **Configure Network Access (Crucial for Render):**
   - Render free/starter web services do not have static IP addresses.
   - Go to **Network Access** > **Add IP Address**.
   - Select **Allow Access From Anywhere** (`0.0.0.0/0`).
   - Confirm and wait for the status to become *Active*.
4. **Copy Connection String:**
   - Click **Connect** > **Drivers** > **Python**.
   - Copy the SRV URI:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority
     ```

---

## 3. Step 2: Render Configuration (FastAPI Backend)

Deploy the backend first so you obtain the production Render URL to feed into Vercel.

### A. Render Service Settings

In your [Render Dashboard](https://dashboard.render.com/):
1. Click **New +** > **Web Service**.
2. Connect your Git repository containing DabbaIQ.
3. Configure the following exact fields:

| Configuration Field | Exact Setting to Enter | Rationale / Source in Repo |
| :--- | :--- | :--- |
| **Name** | `dabbaiq-backend` *(or your custom name)* | Service hostname |
| **Region** | Oregon (US West) or Frankfurt / Singapore | Choose closest to your users/database |
| **Branch** | `main` *(or your working branch)* | Target deployment branch |
| **Root Directory** | `backend` | **CRITICAL:** FastAPI code lives in `backend/` |
| **Runtime** | `Python 3` | Python 3.12+ execution environment |
| **Build Command** | `pip install -r requirements.txt` | Installs dependencies from `backend/requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 4` | Starts ASGI server binding to Render's dynamic `$PORT` |
| **Plan Type** | `Free` or `Starter` | Standard web service tier |
| **Health Check Path** | `/api/health` | Verified endpoint returning HTTP 200 with DB ping |
| **Auto-Deploy** | `Yes` (enabled) | Automatically redeploys on new commits |

### B. Render Environment Variables

In the **Environment** tab of your Render Web Service, add the following key-value pairs:

#### Mandatory Variables:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `APP_ENV` | `production` | Sets production mode |
| `DEBUG` | `false` | Disables debug logs and stack trace leakages |
| `MONGODB_DATABASE` | `dabbaiq` | Target database name |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority` | Full Atlas connection string (**keep secret**) |
| `FRONTEND_ORIGIN` | `https://your-dabbaiq-app.vercel.app` | Allowed CORS origin for the Vercel frontend |
| `CORS_ORIGINS` | `https://your-dabbaiq-app.vercel.app,http://localhost:3000` | Comma-separated list of allowed origins |

> [!NOTE]
> During initial Render setup before your Vercel URL is known, you can set `FRONTEND_ORIGIN` to `http://localhost:3000` or a placeholder. As soon as Vercel deploys, update `FRONTEND_ORIGIN` and `CORS_ORIGINS` with your actual Vercel domain.

#### Optional / Fallback Variables:

| Key | Default / Fallback Behavior if Omitted | Description |
| :--- | :--- | :--- |
| `AI_PROVIDER` | `ollama` | AI engine selector |
| `OLLAMA_BASE_URL` | Defaults to `http://localhost:11434`. In cloud, backend automatically detects offline Ollama and seamlessly falls back to 7-day weighted moving averages. | Point to a remote Ollama server (e.g. RunPod, Modal) if live open-weight Gemma inference is desired. |
| `OLLAMA_MODEL` | `gemma3:4b` | Target open-weight model |
| `SERPAPI_API_KEY` | If absent, `/api/suppliers/search` uses cached mandi benchmarks and raw ingredient costs. | Optional SerpAPI key for live APMC wholesale price lookup. |
| `TIGER_DATA_DATABASE_URL`| If absent, price snapshot persistence returns `unconfigured` gracefully. | Optional PostgreSQL / TimescaleDB hypertable connection string. |
| `TEMPORAL_ADDRESS` | If absent or offline, preparation workflows execute synchronously in-process. | Optional Temporal cluster address. |
| `ELEVENLABS_API_KEY` | If absent, voice transcription features display "Integration not configured". | Optional ElevenLabs key for STT kitchen notes. |
| `BACKBOARD_API_KEY` | Optional | Persistent assistant threads. |
| `TINKER_API_KEY` | Optional | Fine-tuning kitchen model provider. |

---

## 4. Step 3: Vercel Configuration (Next.js Frontend)

Once your Render backend is deployed, note its URL (e.g., `https://dabbaiq-backend.onrender.com`).

### A. Vercel Project Settings

In your [Vercel Dashboard](https://vercel.com/):
1. Click **Add New...** > **Project**.
2. Import the same DabbaIQ Git repository.
3. Configure the following project settings:

| Configuration Field | Exact Setting to Enter | Notes / Rationale |
| :--- | :--- | :--- |
| **Project Name** | `dabbaiq` *(or your custom name)* | Creates domain `<project-name>.vercel.app` |
| **Framework Preset** | `Next.js` | Auto-detected from `package.json` |
| **Root Directory** | Click **Edit** and select `frontend` | **CRITICAL:** Next.js code is in `frontend/` |
| **Build Command** | Leave default (`npm run build` or `next build`) | Uses Next.js Turbopack compiler |
| **Output Directory** | Leave default (`.next`) | Standard Next.js build output |
| **Install Command** | Leave default (`npm install`) | Installs dependencies from `frontend/package.json` |
| **Node.js Version** | `20.x` or `22.x` | Verified compatible with React 19.3 & Next.js 16.4 |

### B. Vercel Environment Variables

In the **Environment Variables** section of the Vercel import screen (applied to Production, Preview, and Development):

| Variable Name | Exact Value Format | Critical Rule |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | `https://dabbaiq-backend.onrender.com/api` | **MUST include `/api` suffix!** All FastAPI routes are mounted under prefix `/api`. Do **NOT** add a trailing slash after `/api`. |

4. Click **Deploy**. Vercel will install dependencies, compile all 15 routes, and provide your live URL (e.g. `https://dabbaiq.vercel.app`).

---

## 5. Step 4: CORS & Handshake Finalization

Now that your Vercel frontend has a live production domain:

1. Return to your **Render Dashboard** > `dabbaiq-backend` > **Environment**.
2. Update the CORS variables:
   - `FRONTEND_ORIGIN`: `https://dabbaiq.vercel.app`
   - `CORS_ORIGINS`: `https://dabbaiq.vercel.app,http://localhost:3000`
3. Click **Save Changes**. Render will automatically trigger a zero-downtime rolling restart.

---

## 6. Pre-Flight Verification & Verification Checklist

Once both services are running, verify each item in this checklist:

### 1. Backend Health Check
Open `https://<your-render-backend>.onrender.com/api/health` in your browser.
Expected JSON:
```json
{
  "status": "ok",
  "app_name": "DabbaIQ",
  "version": "1.0.0",
  "app_env": "production",
  "db_connected": true,
  "db_message": "Connected to MongoDB Atlas database 'dabbaiq'",
  "database": "dabbaiq",
  "ai_available": false,
  "ai_model": "gemma3:4b"
}
```

### 2. Frontend Operational Connectivity
Visit `https://<your-vercel-app>.vercel.app`:
- **Dashboard (`/`):** Verify that the telemetry banner displays **"Atlas Live"** (green badge) and portions data renders without connection errors.
- **Recipe Library (`/recipes`):** Click **View Cost Breakdown** on a recipe (e.g., *Dal Tadka Khichdi Meal*). Verify that portion costing calculations render.
- **AI Prep Planner (`/planner`):** Generate a forecast for tomorrow. Verify that the deterministic 7-day weighted moving average fallback computes demand portion buffers smoothly.
- **Inventory & Stock (`/inventory`):** Verify that stock items load from MongoDB Atlas.
- **Settings & Diagnostics (`/settings`):** Inspect the system status cards. Confirm MongoDB Atlas shows as connected, and unconfigured optional services (Ollama, SerpAPI, Temporal, ElevenLabs) display their safe fallback indicators.

---

## 7. Local & External Service Dependency Matrix

| Service | Local Dev Mode | Cloud Deployment Mode (Render) | Automatic Fallback Behavior |
| :--- | :--- | :--- | :--- |
| **MongoDB** | Local MongoDB or Atlas | MongoDB Atlas (M0/Dedicated) | If disconnected, boots in safe in-memory demo mode (`is_demo: true`). |
| **Ollama / Gemma** | `http://localhost:11434` | Remote inference URL or Unconfigured | If offline, automatically falls back to 7-day weighted moving averages. Planning and portioning never break. |
| **Temporal Worker** | `localhost:7233` | Temporal Cloud or Unconfigured | If unconfigured, preparation workflows execute synchronously in-process. |
| **SerpAPI Mandi Rates** | `SERPAPI_API_KEY` | Optional key in Render env | If absent, uses cached mandi benchmarks and raw ingredient costs. |
| **Tiger Data** | PostgreSQL URL | TimescaleDB Cloud or Unconfigured | If absent, hypertable writes return `unconfigured` gracefully. |
| **ElevenLabs Audio** | `ELEVENLABS_API_KEY` | Optional key in Render env | If absent, STT button shows unconfigured message without crashing. |

---

## 8. Security & Secret Protection Protocol

1. **Zero Secret Leakage:** Never commit `.env` or `.env.local` files to GitHub.
2. **Client-Side Isolation:** Only variables prefixed with `NEXT_PUBLIC_` are bundled into the Vercel frontend. The only public variable in DabbaIQ is `NEXT_PUBLIC_API_BASE_URL`.
3. **Backend Credential Isolation:** Database passwords, connection strings, and partner API keys (`MONGODB_URI`, `SERPAPI_API_KEY`, `ELEVENLABS_API_KEY`) reside exclusively within Render's secure server-side environment variables and are never transmitted to client browsers.
4. **Diagnostic Obfuscation:** The `/api/health` and `/api/integrations/status` endpoints never return database passwords, authentication tokens, or raw connection strings.
