'use client';

import React from 'react';
import Link from 'next/link';
import {
  Layers,
  Sparkles,
  Boxes,
  BookOpen,
  Trash2,
  Receipt,
  BarChart3,
  Settings,
  ShieldCheck,
  Server,
  Database,
  Cpu,
  RefreshCw,
  GitBranch,
  Terminal,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Clock,
  Activity,
  FileText,
  UserCheck,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

const MODULE_STATUSES = [
  {
    module: 'Master Kitchen Desk',
    route: '/',
    status: 'OPERATIONAL',
    statusColor: 'bg-primary-container text-white',
    description: 'Real-time shift summary, portions target, critical stock alarms, and 7-day sales velocity chart.',
    contracts: 'GET /api/dashboard',
  },
  {
    module: '3D Tiffin Experience',
    route: '/experience',
    status: 'OPERATIONAL',
    statusColor: 'bg-primary-container text-white',
    description: 'Interactive scroll-driven 4-tier SS304 tiffin disassembly with live CAD elevation HUD (Z+85mm).',
    contracts: 'Static / Client State Machine',
  },
  {
    module: 'AI Preparation Planner',
    route: '/planner',
    status: 'OPERATIONAL',
    statusColor: 'bg-primary-container text-white',
    description: 'Portion demand forecasting with Gemma 2 AI reasoning, safety buffer slider, and BOM shortage detection.',
    contracts: 'GET /api/plans, POST /api/plans',
  },
  {
    module: 'Inventory & Stock Ledger',
    route: '/inventory',
    status: 'OPERATIONAL',
    statusColor: 'bg-primary-container text-white',
    description: 'Raw commodity stock management, threshold warnings, reorder alerts, and SerpAPI APMC mandi benchmarking.',
    contracts: 'GET /api/inventory, POST /api/inventory/adjust',
  },
  {
    module: 'Recipe Library & Costing',
    route: '/recipes',
    status: 'OPERATIONAL',
    statusColor: 'bg-primary-container text-white',
    description: 'Heritage Bombay tiffin BOM formulas, dynamic per-dabba costing based on ingredient prices, and multilingual menu generation.',
    contracts: 'GET /api/recipes, POST /api/recipes',
  },
  {
    module: 'Sales & Dispatch Ledger',
    route: '/sales',
    status: 'OPERATIONAL',
    statusColor: 'bg-primary-container text-white',
    description: 'Fast meal dispatch logging, date/period filters, revenue tracking, and CSV transaction batch imports.',
    contracts: 'GET /api/sales, POST /api/sales',
  },
  {
    module: 'Waste Tracker & Scrap Loss',
    route: '/waste',
    status: 'OPERATIONAL',
    statusColor: 'bg-primary-container text-white',
    description: 'Food scrap auditing with sunken ingredient cost estimation and loss prevention intelligence.',
    contracts: 'GET /api/waste, POST /api/waste',
  },
  {
    module: 'Business & Operations Reports',
    route: '/reports',
    status: 'OPERATIONAL',
    statusColor: 'bg-primary-container text-white',
    description: 'P&L rollups, ingredient consumption charts, waste cost ratios, and automated CSV data streams.',
    contracts: 'GET /api/reports/summary, GET /api/reports/export',
  },
  {
    module: 'Station Diagnostics & Hardware',
    route: '/settings',
    status: 'OPERATIONAL',
    statusColor: 'bg-primary-container text-white',
    description: 'MUM-04 station hardware calibration, latency heartbeats, database ping tests, and model diagnostics.',
    contracts: 'GET /api/health, GET /api/integrations/status',
  },
];

export default function ProjectInfoPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div className="flex items-center gap-2 text-xs font-mono">
          <Link href="/" className="text-primary hover:underline font-bold">
            Dashboard
          </Link>
          <span className="text-on-surface-variant">/</span>
          <span className="text-on-surface font-semibold">Technical Architecture &amp; System Docs</span>
        </div>
        <Link
          href="/"
          className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5 shadow-sm"
        >
          <span>Return to Kitchen Desk</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Header Banner */}
      <div className="desk-card p-6 sm:p-8 bg-surface space-y-3 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-surface-container-high rounded text-xs font-mono font-semibold text-primary">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span>DABBAIQ SPECIFICATION • STITCH HANDOFF • PHASE 6</span>
        </div>
        <h1 className="font-headline font-bold text-3xl sm:text-4xl text-primary tracking-tight">
          System Architecture &amp; Technical Specification
        </h1>
        <p className="font-body text-sm sm:text-base text-on-surface-variant max-w-3xl leading-relaxed">
          Comprehensive, source-grounded technical documentation of the DabbaIQ Master Kitchen Operations Desk: architecture, data pipelines, local Gemma AI integration, database schemas, and reproduction workflows.
        </p>
      </div>

      {/* SECTION 1: PROBLEM STATEMENT & TARGET AUDIENCE */}
      <div className="desk-card p-6 space-y-4 bg-surface">
        <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/30">
          <Layers className="w-5 h-5 text-secondary" />
          <h2 className="font-headline font-bold text-xl text-primary">
            1. Problem Statement &amp; User Workflows
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-body leading-relaxed text-on-surface-variant">
          <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-2">
            <h3 className="font-headline font-bold text-sm text-on-surface">The Commercial Dabba Challenge</h3>
            <p>
              In Mumbai and metropolitan commercial kitchens, thousands of lunch dabbas are prepped under stringent 3-hour windows (09:00 — 12:00 IST). Kitchen managers traditionally face unpredictable corporate attendance, sudden monsoon transit delays, and volatile APMC mandi ingredient rates.
            </p>
            <p>
              Over-preparation leads to 12–18% direct food scrap loss, while under-preparation causes missed delivery slots across South Mumbai and BKC corporate delivery circuits.
            </p>
          </div>
          <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-2">
            <h3 className="font-headline font-bold text-sm text-on-surface">Target Users &amp; Daily Workflow</h3>
            <ul className="space-y-1.5 list-disc pl-4 text-on-surface">
              <li><strong>Head Chefs &amp; Ops Directors:</strong> Establish morning batch targets, review safety buffers, and verify ingredient stock before cooking begins.</li>
              <li><strong>Kitchen Line Leads:</strong> Log dispatches, mark low-stock alerts, and reconcile unsold tiffins into the waste log at 14:30 IST.</li>
              <li><strong>Procurement Managers:</strong> Benchmark commodity grain prices against Vashi APMC mandi indices via SerpAPI.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* SECTION 2: END-TO-END DATA FLOW & ARCHITECTURE */}
      <div className="desk-card p-6 space-y-4 bg-surface">
        <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/30">
          <Server className="w-5 h-5 text-primary" />
          <h2 className="font-headline font-bold text-xl text-primary">
            2. System Architecture &amp; Data Flow
          </h2>
        </div>

        <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/40 space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
            {/* Layer 1: Client Shell */}
            <div className="p-4 bg-surface rounded-lg border border-outline-variant/40 space-y-1 shadow-xs">
              <span className="text-[10px] text-secondary font-bold uppercase block">Presentation Layer</span>
              <div className="font-headline font-bold text-sm text-on-surface">Next.js 16 (Turbopack)</div>
              <span className="text-[10px] text-on-surface-variant block">React 19, Vanilla Tailwind, Epilogue &amp; Manrope</span>
              <div className="pt-2 text-[10px] text-primary flex justify-center gap-2">
                <span>• Dual-Deck Command Bar</span>
                <span>• 12 Screen Routes</span>
              </div>
            </div>

            {/* Layer 2: API Gateway */}
            <div className="p-4 bg-surface rounded-lg border border-outline-variant/40 space-y-1 shadow-xs">
              <span className="text-[10px] text-primary font-bold uppercase block">Core Application Engine</span>
              <div className="font-headline font-bold text-sm text-primary">Python FastAPI</div>
              <span className="text-[10px] text-on-surface-variant block">Uvicorn ASGI • AsyncIO • Pydantic v2</span>
              <div className="pt-2 text-[10px] text-secondary flex justify-center gap-2">
                <span>• Strict /api Contracts</span>
                <span>• 101 Automated Tests</span>
              </div>
            </div>

            {/* Layer 3: Persistence & Reasoning */}
            <div className="p-4 bg-surface rounded-lg border border-outline-variant/40 space-y-1 shadow-xs">
              <span className="text-[10px] text-tertiary font-bold uppercase block">Persistence &amp; AI</span>
              <div className="font-headline font-bold text-sm text-on-surface">MongoDB Atlas + Gemma 2</div>
              <span className="text-[10px] text-on-surface-variant block">Motor Async • Ollama Local Inference</span>
              <div className="pt-2 text-[10px] text-primary-container flex justify-center gap-2">
                <span>• TimescaleDB Hypertables</span>
                <span>• SerpAPI Mandi</span>
              </div>
            </div>
          </div>

          {/* Workflow Data Flow Steps */}
          <div className="p-3 bg-surface-container-high rounded-lg text-on-surface text-[11px] space-y-1.5">
            <span className="font-bold text-primary uppercase block">End-to-End Operational Flow:</span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center pt-1">
              <div className="p-2 bg-surface rounded border border-outline-variant/30">
                <span className="font-bold text-secondary block">1. Ingest Demand</span>
                <span className="text-[10px] text-on-surface-variant">Advance standing orders + Weather + Past 7-day sales</span>
              </div>
              <div className="p-2 bg-surface rounded border border-outline-variant/30">
                <span className="font-bold text-primary block">2. Gemma Reasoning</span>
                <span className="text-[10px] text-on-surface-variant">On-premise LLM calculates batch target &amp; buffer</span>
              </div>
              <div className="p-2 bg-surface rounded border border-outline-variant/30">
                <span className="font-bold text-tertiary block">3. BOM &amp; Mandi Sync</span>
                <span className="text-[10px] text-on-surface-variant">SerpAPI benchmarks wholesale APMC commodity rates</span>
              </div>
              <div className="p-2 bg-surface rounded border border-outline-variant/30">
                <span className="font-bold text-primary-container block">4. Lock &amp; Reconcile</span>
                <span className="text-[10px] text-on-surface-variant">Kitchen dispatch confirmed; unsold logged to scrap loss</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: MODULE IMPLEMENTATION STATUS MATRIX */}
      <div className="desk-card p-6 space-y-4 bg-surface">
        <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/30">
          <Activity className="w-5 h-5 text-secondary" />
          <h2 className="font-headline font-bold text-xl text-primary">
            3. Operational Module Status Matrix
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/40 bg-surface-container text-on-surface">
                <th className="p-2.5 font-bold">Module</th>
                <th className="p-2.5 font-bold">Route</th>
                <th className="p-2.5 font-bold">Status</th>
                <th className="p-2.5 font-bold">API Contract</th>
                <th className="p-2.5 font-bold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-on-surface-variant">
              {MODULE_STATUSES.map((item, idx) => (
                <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                  <td className="p-2.5 font-bold text-on-surface">{item.module}</td>
                  <td className="p-2.5 font-semibold text-primary">{item.route}</td>
                  <td className="p-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.statusColor}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-2.5 text-[11px] font-mono text-secondary">{item.contracts}</td>
                  <td className="p-2.5 font-body text-xs text-on-surface-variant">{item.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: VERIFIED TECH STACK MATRIX */}
      <div className="desk-card p-6 space-y-4 bg-surface">
        <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/30">
          <Cpu className="w-5 h-5 text-secondary" />
          <h2 className="font-headline font-bold text-xl text-primary">
            4. Verified Technology Stack
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-primary">Next.js 16 + React 19</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="font-body text-[11px] text-on-surface-variant">
              Turbopack enabled. Static and dynamic routing with client-side reactive ledger state.
            </p>
          </div>

          <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-primary">FastAPI (Python 3.13)</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="font-body text-[11px] text-on-surface-variant">
              High-concurrency ASGI server with native Pydantic v2 schemas and OpenAPI generation.
            </p>
          </div>

          <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-primary">MongoDB Atlas</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="font-body text-[11px] text-on-surface-variant">
              Async Motor driver storing ingredient catalogs, BOM recipes, sales ledgers, and prep plans.
            </p>
          </div>

          <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-primary">Ollama + Gemma 2</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="font-body text-[11px] text-on-surface-variant">
              On-premise local inference (`gemma2:latest`). Zero external data egress; zero cloud AI token leakage.
            </p>
          </div>

          <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-primary">SerpAPI Wholesale</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="font-body text-[11px] text-on-surface-variant">
              Live Google Shopping commodity price indexing for Vashi APMC wholesale grain rates.
            </p>
          </div>

          <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-primary">Tiger Data / Timescale</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="font-body text-[11px] text-on-surface-variant">
              Time-series hypertables tracking commodity price volatility and historical inflation trends.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 5: REAL API ENDPOINTS REFERENCE */}
      <div className="desk-card p-6 space-y-4 bg-surface">
        <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/30">
          <Code2 className="w-5 h-5 text-primary" />
          <h2 className="font-headline font-bold text-xl text-primary">
            5. Backend API Contracts &amp; Endpoints
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/40 bg-surface-container text-on-surface">
                <th className="p-2.5 font-bold">Method</th>
                <th className="p-2.5 font-bold">Endpoint Route</th>
                <th className="p-2.5 font-bold">Operational Function</th>
                <th className="p-2.5 font-bold">Schema / Contract</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-on-surface-variant">
              <tr>
                <td className="p-2.5 font-bold text-primary">GET</td>
                <td className="p-2.5 font-bold text-on-surface">/api/health</td>
                <td className="p-2.5">Comprehensive database &amp; partner telemetry check</td>
                <td className="p-2.5">HealthResponse</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-primary">GET</td>
                <td className="p-2.5 font-bold text-on-surface">/api/dashboard</td>
                <td className="p-2.5">Shift overview, expected volume, KPI counters, sales chart data</td>
                <td className="p-2.5">DashboardResponse</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-secondary">POST</td>
                <td className="p-2.5 font-bold text-on-surface">/api/plans/generate</td>
                <td className="p-2.5">Runs predictive forecast and Gemma AI reasoning</td>
                <td className="p-2.5">PlanCreateRequest</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-primary">GET</td>
                <td className="p-2.5 font-bold text-on-surface">/api/inventory</td>
                <td className="p-2.5">Fetches raw ingredient catalog &amp; reorder levels</td>
                <td className="p-2.5">IngredientListResponse</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-secondary">POST</td>
                <td className="p-2.5 font-bold text-on-surface">/api/inventory/adjust</td>
                <td className="p-2.5">Adjusts stock levels with reason logging</td>
                <td className="p-2.5">InventoryAdjustment</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-primary">GET</td>
                <td className="p-2.5 font-bold text-on-surface">/api/recipes</td>
                <td className="p-2.5">Master recipe library with BOM ingredient ratios</td>
                <td className="p-2.5">RecipeListResponse</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-primary">GET</td>
                <td className="p-2.5 font-bold text-on-surface">/api/sales</td>
                <td className="p-2.5">Sales transaction ledger with date/meal filters</td>
                <td className="p-2.5">SalesListResponse</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-secondary">POST</td>
                <td className="p-2.5 font-bold text-on-surface">/api/sales</td>
                <td className="p-2.5">Logs quick sale or corporate circuit order</td>
                <td className="p-2.5">SaleCreate</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-primary">GET</td>
                <td className="p-2.5 font-bold text-on-surface">/api/waste</td>
                <td className="p-2.5">Food loss &amp; scrap audit logs with sunk costs</td>
                <td className="p-2.5">WasteListResponse</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-primary">GET</td>
                <td className="p-2.5 font-bold text-on-surface">/api/reports/summary</td>
                <td className="p-2.5">Financial P&amp;L rollups across selected dates</td>
                <td className="p-2.5">ReportSummaryResponse</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 6: KNOWN LIMITATIONS & GRACEFUL FALLBACK MODES */}
      <div className="desk-card p-6 space-y-4 bg-surface">
        <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/30">
          <HelpCircle className="w-5 h-5 text-secondary" />
          <h2 className="font-headline font-bold text-xl text-primary">
            6. Known Limitations &amp; Graceful Fallback Modes
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-1.5">
            <span className="font-bold text-primary block">Ollama AI Offline Fallback</span>
            <p className="font-body text-on-surface-variant">
              When Ollama is offline or Gemma 2 is not pulled locally, the preparation planner automatically falls back to deterministic 7-day weighted moving averages. Kitchen planning never blocks on LLM availability.
            </p>
          </div>
          <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-1.5">
            <span className="font-bold text-primary block">Database Unconfigured / Demo Mode</span>
            <p className="font-body text-on-surface-variant">
              If MongoDB Atlas URI is unconfigured or unreachable, the system runs safely with seeded in-memory demo fixtures clearly badged as `is_demo: true` to prevent data corruption.
            </p>
          </div>
          <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-1.5">
            <span className="font-bold text-primary block">SerpAPI Mandi Rate Limiting</span>
            <p className="font-body text-on-surface-variant">
              When SerpAPI free monthly quota is exhausted (HTTP 429), the wholesale price engine gracefully uses the latest cached mandi benchmark or unit cost stored in the ingredient record.
            </p>
          </div>
          <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-1.5">
            <span className="font-bold text-primary block">3D Storyboard GPU Fallback</span>
            <p className="font-body text-on-surface-variant">
              On mobile or low-power devices where WebGL or hardware acceleration is constrained, the `/experience` page serves pixel-crisp studio stage renders and elevation HUD indicators with zero scroll jank.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 7: PRIVACY & DATA PROTECTION (INDIA DPDP ACT 2023) */}
      <div className="desk-card p-6 space-y-4 bg-surface">
        <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/30">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h2 className="font-headline font-bold text-xl text-primary">
            7. Privacy, Security &amp; DPDP Notice
          </h2>
        </div>
        <div className="space-y-2 text-xs font-body text-on-surface-variant leading-relaxed">
          <p>
            DabbaIQ is designed for kitchen privacy under the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong>.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-on-surface">
            <li><strong>Zero Cloud AI Egress:</strong> Gemma 2 inference runs completely on-premise inside the kitchen local network via Ollama. No recipe formulas, client dietary requests, or portion records are sent to cloud LLM providers.</li>
            <li><strong>Credential Isolation:</strong> No database passwords, SerpAPI keys, or session tokens are ever rendered in the browser UI, client JavaScript bundles, or HTTP response headers.</li>
            <li><strong>Audit Logging:</strong> Inventory adjustments and scrap waste logs maintain immutable audit timestamps without customer PII.</li>
          </ul>
        </div>
      </div>

      {/* SECTION 8: LOCAL SETUP & REPRODUCTION */}
      <div className="desk-card p-6 space-y-4 bg-surface">
        <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/30">
          <Terminal className="w-5 h-5 text-secondary" />
          <h2 className="font-headline font-bold text-xl text-primary">
            8. Local Run &amp; Reproduction Instructions
          </h2>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div>
            <span className="font-bold text-primary block mb-1">1. Start FastAPI Backend:</span>
            <div className="bg-surface-container-high p-3 rounded-lg text-on-surface">
              <code>cd dabbaiq/backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload</code>
            </div>
          </div>

          <div>
            <span className="font-bold text-primary block mb-1">2. Run Backend Pytest Suite:</span>
            <div className="bg-surface-container-high p-3 rounded-lg text-on-surface">
              <code>cd dabbaiq/backend && python -m pytest tests -v</code>
            </div>
          </div>

          <div>
            <span className="font-bold text-primary block mb-1">3. Start Next.js Development Server:</span>
            <div className="bg-surface-container-high p-3 rounded-lg text-on-surface">
              <code>cd dabbaiq/frontend && npm run dev</code>
            </div>
          </div>

          <div>
            <span className="font-bold text-primary block mb-1">4. Run Production Build Validation:</span>
            <div className="bg-surface-container-high p-3 rounded-lg text-on-surface">
              <code>cd dabbaiq/frontend && npm run build</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
