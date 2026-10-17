# DabbaIQ — Stitch + Antigravity Phase-by-Phase Implementation Pack

**Existing Stitch project:** `DabbaIQ — Inside the Dabba`  
**Project ID:** `1933848754259984407`  
**Project URL:** https://stitch.withgoogle.com/projects/1933848754259984407  
**3D scroll reference:** https://webflow.com/made-in-webflow/3d-scroll  
**Product/project-page reference:** https://twacharakshak.netlify.app/

## How to use this pack

Do **not** paste all phases into Antigravity as one giant task. Complete them in order and paste the next phase only after the current phase reports evidence of completion. This keeps the agent anchored to the actual Stitch screens instead of generating a generic dashboard and claiming success.

Use the same existing DabbaIQ workspace and repository. The Stitch project is the visual source of truth. Do not create another Stitch project. The user-facing site should be about running an Indian tiffin/kitchen business; detailed engineering-stack documentation belongs on a dedicated **Project Info** page.

---

# Part A — Connect Stitch to Antigravity

## Recommended setup (Windows PowerShell)

First check Node.js:

```powershell
node --version
npm --version
```

The current `@google/stitch` CLI documentation requires Node.js 20 or newer. If your existing Stitch MCP is already connected and can enumerate the project/screens, do not install another server; skip to **Verify the connection**.

If Stitch MCP is not working, use the official Stitch CLI setup:

```powershell
npm install -g @google/stitch
stitch login
stitch status
stitch mcp install
stitch agent-skills add
```

`stitch login` opens Google authentication. If the CLI reports a missing Canvas credential, follow Stitch’s credential setup and keep the credential in the local environment/configuration; **never paste API keys into an Antigravity prompt, source file, issue, or chat**. Some Canvas operations may require a Stitch API key even after login.

After setup:

1. Fully restart Antigravity.
2. Open Antigravity’s Agent panel → `…` → **MCP Servers**. Confirm Stitch appears and is connected. Depending on the Antigravity version, use Settings → Customizations → Installed MCP Servers to inspect or refresh it.
3. From a terminal, verify:

```powershell
stitch status
stitch find projects --limit 50 --json
stitch get project 1933848754259984407 --json
```

The existing project ID must be returned. Do not create a new project if this check fails.

### Alternative setup if the official CLI's editor registration does not appear in Antigravity

A separate Stitch MCP setup wizard supports Antigravity:

```powershell
npx @_davideast/stitch-mcp init
```

Choose **Antigravity**, then select API-key or OAuth authentication and follow the wizard. Do not configure both MCP implementations at the same time unless you intentionally understand the duplicate server configuration. Then restart Antigravity and run its MCP status/connection check.

**Do not continue to implementation unless Antigravity can use Stitch tools to read the exact existing project and list its screens.** If the tools cannot list screens, fix MCP authentication/configuration first. Do not ask the agent to guess the screens from the project URL alone.

---

# Part B — The 26-screen acceptance manifest

The agent must query the actual Stitch project and record every screen’s **exact title, screen ID, device/breakpoint if available, and access/export status**. The list below is an expected audit checklist based on the current project handoff, not a substitute for querying Stitch. If the actual title or ID differs, use the actual Stitch metadata and document the difference.

1. Inside the Dabba — Cover
2. Inside the Dabba — Experience
3. Storyboard 01 — Closed Stack
4. Storyboard 02 — Lid Lifting
5. Storyboard 03 — Upper Container Separating
6. Storyboard 04 — Several Tiers Fully Separated / Exploded View
7. Storyboard 05 — Feature Architecture
8. Storyboard 06 — Complete Kitchen System
9. Inside the Dabba — Phase 03: AI Preparation Planner (editorial transition)
10. Inside the Dabba — Inventory & Stock (editorial)
11. Inside the Dabba — Recipe Library (editorial)
12. The second/empty Recipe Library screen (audit its actual purpose; do not ignore, delete, or silently count it as a completed design)
13. Inside the Dabba — Sales Log (editorial)
14. Inside the Dabba — Waste Tracker (editorial)
15. DabbaIQ Operational Dashboard — Desktop
16. DabbaIQ Mobile — Kitchen Dashboard
17. DabbaIQ AI Preparation Planner — Desktop
18. DabbaIQ Mobile — AI Preparation Planner
19. DabbaIQ Sales Log — Desktop
20. DabbaIQ Inventory & Stock — Desktop
21. DabbaIQ — Recipe Library & Recipe Costing
22. DabbaIQ — Waste Tracker & Food Loss Intelligence
23. DabbaIQ — Business & Operations Reports
24. DabbaIQ — Settings & System Health
25. DabbaIQ — Privacy & Data Protection Policy
26. DabbaIQ — Terms of Service & Operational License

If the current project has fewer than 26 usable screens, identify which screen IDs/titles are missing or empty. Work only inside the existing project. Generate or repair a screen only after confirming that the intended screen is absent/incomplete; do not duplicate already valid screens. For the known empty/duplicate Recipe Library screen, inspect its metadata and neighboring designs. If it is genuinely an abandoned placeholder, repair that same screen into a useful complementary recipe-costing/detail state while preserving the existing screen ID wherever Stitch permits. Do not invent a different product direction.

---

# Shared execution contract

Append or keep these rules active through every phase:

- Inspect before editing. Start with the real workspace root, `git status`, recent diffs, package scripts, routes, components, API client, backend schemas, and current tests.
- Never overwrite uncommitted work, `.env`, user data, database tables, seeded data, existing integrations, or existing Stitch screens without a specific reason.
- Preserve the existing Next.js/React/TypeScript frontend and FastAPI/backend architecture where present. Do not replace a working system with a starter template.
- Use the actual Stitch screen and its exported HTML/CSS/assets as the primary visual reference. Do not approximate from a title alone. Capture evidence of the source used for every implemented page.
- Do not claim a page is implemented merely because a URL responds with HTTP 200. Check layout, real controls, network/API behavior, and the browser console.
- No fake metrics, fake suppliers, fake AI answers, fake connectivity, fake “live” statuses, or fabricated testimonials. Label sample/demo data clearly if it is needed for a safe preview.
- Do not expose API keys, secrets, credentials, private customer data, or `.env` contents in output, screenshots, logs, docs, or the final report.
- Make small changes and verify them before starting the next phase. Keep a changelog/test record in `docs/implementation/`.
- If a tool or credential is unavailable, report that exact blocker and finish independent work. Never pretend to have read screens, assets, or code that could not be accessed.

---

# PHASE 0 — Stitch MCP handshake (connection test only)

**Paste this first into Antigravity. Do not implement the application yet.**

```text
PHASE 0 — STITCH MCP HANDSHAKE ONLY. DO NOT EDIT APPLICATION CODE.

Target Stitch project: DabbaIQ — Inside the Dabba
Project ID: 1933848754259984407
Project URL: https://stitch.withgoogle.com/projects/1933848754259984407

Use the installed Stitch MCP tools to read this exact existing project. First list the available Stitch tools and call the relevant project/screen listing and screen-detail tools. Verify that you can retrieve project metadata and individual screen details, not merely open the URL in a browser.

Required evidence:
1. Exact project title and ID returned by Stitch.
2. Total screen count reported by Stitch.
3. Exact screen title + screen ID for every screen found.
4. Which screens allow design/image/code export and which do not.
5. Whether the empty/duplicate Recipe Library screen exists.
6. A short list of any tool/authentication errors, if any.

Do not create a project, do not create or edit screens, and do not edit application code during this phase. If you cannot access Stitch tools, stop and explain the exact missing MCP server/tool/authentication requirement. Do not fabricate screen IDs or claim the project was inspected from its URL alone.

Save the raw non-secret results and a readable inventory in docs/design/stitch-screen-manifest.md and docs/design/stitch-screen-manifest.json if the workspace is available. Never save tokens, API keys, browser cookies, or other credentials. End with a checklist showing which requirements passed and failed.
```

**Phase 0 exit gate:** Antigravity can enumerate the actual project and screen IDs. Do not proceed without this.

---

# PHASE 1 — Reconcile all 26 screens and export design references

```text
PHASE 1 — STITCH SCREEN AUDIT AND REFERENCE EXPORT.

Use the verified Stitch MCP connection and the existing project ID 1933848754259984407. Do not create a new project.

1. Enumerate the project’s complete screen inventory and compare it against the 26-screen acceptance manifest in this prompt pack.
2. Match screens by exact Stitch IDs first and titles second. Do not assume similar titles are identical designs.
3. For each screen, retrieve the best available source: screen metadata, rendered screenshot, HTML/CSS/implementation code, component details, and linked assets. Download/export only using supported Stitch tools/CLI. Never fabricate an export.
4. Place local references under docs/design/stitch/ and reusable local visual assets under frontend/public/stitch/ (or the equivalent public-assets folder found in the actual repo). Preserve original filenames where useful; use stable descriptive filenames for new copies. Keep originals and record provenance.
5. Update docs/design/stitch-screen-manifest.md with: index, exact screen title, exact screen ID, device, source asset paths, code/reference paths, intended route/section, desktop/mobile relationship, and status (retrieved / incomplete / unavailable / repaired).
6. Update docs/design/stitch-screen-manifest.json with the same normalized data so later phases can use the manifest rather than guessing.
7. For any missing/incomplete screen, retry retrieval individually. If genuinely absent, repair/create only that missing screen inside the same Stitch project after checking there is no equivalent valid screen. For the empty Recipe Library placeholder, inspect it and turn it into a complementary recipe-costing/detail screen if it is genuinely an empty abandoned placeholder; never leave it blank and never make a duplicate route solely for the duplicate title.
8. Do not change application code yet. Do not mark a design as complete unless an exported render/source or valid screen-detail response confirms it.

Acceptance gate: every expected screen has a real Stitch ID, real title, and a recorded source/reference OR an explicit blocker with evidence. Report any count mismatch and resolve it before continuing. Summarize all 26 rows; do not summarize them as “all done” without row-level evidence.
```

**Phase 1 exit gate:** the manifest has 26 reconciled rows; incomplete/placeholder screens are explicitly handled; the useful design references are available locally or a concrete access blocker is recorded.

---

# PHASE 2 — Audit the actual app and create an implementation map

```text
PHASE 2 — REPOSITORY AUDIT AND ROUTE/API MAPPING. DO NOT REDESIGN YET.

Inspect the current project in place. Preserve the current Git working tree, existing changes, .env files, databases, and integrations. Run git status before editing. Discover the real repository root and inspect package.json scripts, Next.js routes/layouts, components, styles, API clients, types, Zod schemas, Zustand stores, FastAPI routers, Pydantic models, database operations, and tests.

Do not assume file paths based on a previous report; verify the current workspace. Do not dump secrets from .env. Use .env.example or variable names only.

Create docs/implementation/current-state-audit.md and docs/implementation/screen-route-api-map.md. Map all 26 Stitch rows to one of: (a) unique app route, (b) section/state of the same scroll narrative, (c) desktop/mobile variant of an existing route, or (d) reference-only storyboard frame. Explain the mapping so a storyboard image is not mistakenly implemented as a separate application route.

Expected user-facing operational route set where consistent with the current repo: /dashboard, /planner, /inventory, /recipes, /sales, /waste, /reports, /settings, /privacy, /terms, and a dedicated /project-info page. The immersive brand story should be reachable from the main entry point and from navigation. If / currently serves the dashboard, plan a safe migration so the dashboard remains reachable at /dashboard and no important existing deep links break. Retain /experience as an intentional alias or useful story route rather than leaving it confusing/duplicative.

Inspect every current API endpoint and its actual response schema. Mark each required UI behavior as connected, missing API, presentational only, or unknown. Never claim an integration works just because its status endpoint returns 200.

Do not start bulk UI rewrites in this phase. Produce a concise architecture report, route map, test baseline, build status, and prioritized gaps. If a build/test command fails, capture the actual error and don't conceal it.
```

**Phase 2 exit gate:** the agent provides a source-grounded route/API map and knows which files are safe to change.

---

# PHASE 3 — Design system, product navigation, and app shell

```text
PHASE 3 — IMPLEMENT THE REAL DESIGN SYSTEM AND EASY NAVIGATION.

Use the Stitch manifest and actual exported designs. Implement shared tokens and shell components before feature-page polish. Preserve existing backend/API contracts.

Exact DabbaIQ palette:
- Sunshine #FFC926
- Cream #F3E8CC
- Crisp Carrot #F96015
- Tomato Burst #D52518
- Forest Green #18542A
- Kiwi #9ABC05

Use the typography already proven in the repository/design where available. Preferred hierarchy: distinctive editorial display/headline face such as Epilogue/Fraunces for brand storytelling; Manrope (or the actual approved equivalent) for operational body/UI; JetBrains Mono only for timestamps, units, IDs, and technical telemetry. Verify fonts load correctly and provide fallbacks.

Visual art direction: tactile, premium Indian tiffin/kitchen editorial identity; warm paper/cream surfaces, brushed stainless steel, realistic food photography, strong typography, asymmetric but disciplined composition, restrained borders, purposeful whitespace, clear labels, subtle physical shadows. Use the palette with restraint: Forest Green for primary actions, Sunshine for key attention, tomato only for destructive/error states, orange for warnings, kiwi for positive/stock status. Keep contrast accessible.

Non-generic / anti-template requirements:
- No purple/pink AI gradients, generic blue-purple SaaS template, glowing blobs, floating AI orbs, robot art, meaningless sparkles, unneeded glassmorphism, walls of identical cards, fake graphs, or random stock photos.
- Every component must have a real job. Cards, badges, icons, charts, labels, and animations must reflect meaningful product information or an actual action.
- Use real project assets/photography from Stitch or the repo where available. Do not invent “live” telemetry or fake customer logos.

Navigation must be immediately understandable; the current navigation is reported as difficult. Create a consistent and testable information hierarchy.
Operational primary navigation: Dashboard, Preparation Planner, Inventory, Recipes, Sales, Waste, Reports. Settings is secondary. Project Info, Privacy, and Terms must remain discoverable but must not crowd the main work navigation.

Desktop: use a clear fixed or sticky sidebar/rail only if it matches Stitch, with descriptive labels and icons, a strong active-route state, visible current page title, and an obvious collapse control if collapsible. Include accessible tooltips only when labels are hidden. Do not make icon-only controls the default desktop navigation. Keep one predictable location for primary actions and search/date filters.

Mobile: implement a real compact responsive navigation (e.g. a small bottom navigation with the most-used pages and a labelled “More” sheet for remaining routes, or the exact Stitch design if supplied). All routes must be reachable without horizontal page scrolling. Menus close predictably and have keyboard/screen-reader behavior.

Public/brand navigation: link the Inside the Dabba story, feature sections, “Open Kitchen Dashboard” CTA, and Project Info. The 3D background is part of the story/landing experience, not a reason to make routine kitchen operations slow or difficult.

Implement reusable buttons, inputs, selects, date filters, data tables, tabs, empty/error/loading states, confirmation dialogs, toasts, page headers, breadcrumb/page identity where helpful, and a responsive content container. Give each interactive item hover/focus/pressed/disabled states. Buttons that look clickable must do something. Active links must show the current route.

Keep styling consistent with Stitch. Avoid restyling every page independently. After implementation, use browser screenshots at desktop and mobile widths and fix navigation overflow, clipped text, unpredictable spacing, and contrast issues. Run lint/typecheck/build if the repo supports them and report exact results.
```

**Phase 3 exit gate:** all routes can be reached through understandable navigation on desktop and mobile; no icon-only maze; shared tokens/components match Stitch.

---

# PHASE 4 — Build the “Inside the Dabba” scroll-driven 3D story

```text
PHASE 4 — IMPLEMENT THE IMMERSIVE INSIDE-THE-DABBA EXPERIENCE.

Reference design: the existing Stitch “Inside the Dabba” cover, experience screen, and six storyboard states. Motion reference: https://webflow.com/made-in-webflow/3d-scroll. Use it for the concept of scroll-scrubbed perspective/depth and continuous transitions, not to copy its exact artwork or site.

Create a polished product-story entry experience with the 3D tiffin as a persistent/sticky background hero while the page scrolls. As the visitor progresses through the story, the tiffin should open tier by tier: closed stacked tiffin → lid begins lifting → upper tier separates → several tiers fully separate → individual compartments relate to product modules → complete kitchen system. The user should be able to navigate directly to real pages from the story, not just view a decorative animation.

Use the actual Stitch storyboard images, exported HTML/CSS, and repository assets as the source of truth. Search the repo for actual GLB/GLTF/FBX/OBJ/texture assets before creating new assets. If a usable model exists, use it. If no 3D model exists, build a lightweight, physically plausible layered stainless-steel tiffin from proper 3D primitives/materials using the existing stack (Three.js / React Three Fiber only if it fits the installed app and adds value). Use the available Stitch stage renders as a robust fallback. Never show broken-model placeholders or claim genuine 3D if the implementation is only a sequence of flat screenshots.

Visual target: realistic brushed SS-304 body, clear metal rim thickness, separated stackable tiers, Forest Green handles/structural details, Sunshine latch accents, tasteful steam only if the design supports it, soft studio lighting and grounding shadows. Avoid toy-like exaggerated geometry, over-reflective chrome, neon outlines, floating unrelated icons, and generic particles.

Scroll choreography:
1. Build a tall, scroll-controlled story with a pinned/sticky scene and content sections that move through it.
2. Make scroll progress drive animation deterministically; avoid auto-running endless animations that fight the visitor's scroll.
3. Sync the tier state to the current content section. Include a visible but discreet progress indicator/section labels.
4. Add direct, plainly named links from relevant sections to /dashboard, /planner, /inventory, /recipes, /sales, /waste, and /reports. The links must navigate to the correct routes and retain consistent navigation after route changes.
5. Give the visitor an obvious “Skip intro / Open Kitchen Dashboard” route. Storytelling must never trap users in a long animation.
6. Keep site header/nav legible over the scene; add a stable background/scrim only if needed for contrast.
7. End with a clear product summary and actions, not a tech-stack dump.

Engineering/performance:
- Honor prefers-reduced-motion and keyboard users; provide a static, elegant tiffin composition and a normal linear content flow for reduced motion.
- On mobile, reduce model cost, avoid pinning that blocks touch scrolling, and make the story usable on low-power devices.
- Pause/limit rendering while the canvas is off-screen or the page is hidden. Avoid layout shifts, runaway GPU work, scroll-jank, and huge dependencies where a lighter approach is sufficient.
- Implement loading/error fallback if WebGL is unavailable. The fallback should still communicate the six story states and keep all links functional.
- Verify mobile/desktop scroll positions, forward and backward scrolling, refresh on deep link, and keyboard navigation.

The normal operational routes should not use the full-screen 3D animation as an obstruction. Keep the immersive background confined to the story/landing context, with a clean “Open Kitchen Dashboard” transition into the practical app shell.
```

**Phase 4 exit gate:** scroll progress really changes the tiffin state; links navigate to working pages; reduced motion/mobile/fallback works; no scrolling trap.

---

# PHASE 5 — Implement the operational modules from Stitch

Run this phase in the listed sub-batches. Do not ask the agent to write all seven modules in one giant edit if the context or editor becomes unstable. Keep the same shared design shell and use the manifest for each screen.

## 5A — Dashboard and AI Preparation Planner

```text
PHASE 5A — DASHBOARD + AI PREPARATION PLANNER.

Use the exact Stitch desktop and mobile screens mapped in the manifest. Implement the operational dashboard and preparation planner using actual API contracts discovered in Phase 2.

Dashboard priorities: an obvious page title; current shift/context only where actually configured; high-value kitchen KPIs tied to real API data; actionable alerts; quick actions such as recording a sale or opening stock/planning; a concise prep/production summary; useful recent activity when data exists. Do not overload the first screen with every statistic. Do not display placeholder metrics as live data.

Planner priorities: shift/date/meal period controls that actually affect calculations; batch/preparation counts; ingredient/BOM demand; shortage/warning logic; buffer controls with units and clear explanation; AI reasoning/recommendations only when the backend returns them; an understandable loading and failure state; visible difference between calculated suggestions and saved/committed kitchen work. If Temporal or AI execution fails, show that accurately and allow recovery when possible.

All buttons, sliders, tabs, filters, modals, and save/run actions must be connected. Prevent duplicate submissions, validate inputs, explain errors in plain language, and refresh affected data after success. Never hardcode a “Gemma is online” status based on the existence of a label. Match Stitch composition without blindly copying decorative noise.

Test at desktop and mobile widths, including empty backend results, API failure, validation errors, and successful operations. Run checks and report results before proceeding.
```

## 5B — Inventory and Recipe Library

```text
PHASE 5B — INVENTORY + RECIPE LIBRARY/COSTING.

Use the actual Stitch Inventory, Recipe Library, Recipe Costing Matrix, and mobile/desktop variants in the manifest.

Inventory must support the real existing functions: inspect current stock, search/filter, stock adjustments or transactions that exist in the API, low-stock state derived from real thresholds, units, supplier/price history only when the relevant endpoint is actually connected, and clear success/error feedback. Quantity changes must be validated; do not silently save a change that failed on the server.

Recipes must display the actual available recipe data, ingredient/BOM list, portion/quantity units, recipe yield, and cost calculations based on verified ingredient prices. Show formulas or the costing basis in understandable language. If ingredient prices are missing, mark the cost as incomplete/unavailable instead of inventing it. Recipe create/edit/delete features must match existing backend support; implement the missing smallest compatible API only after inspecting architecture and migrations. Confirm destructive changes.

The empty duplicate Recipe Library Stitch screen must be resolved according to the manifest; do not leave an unintentional blank screen. Reuse shared table, modal, input, empty-state, and unit-formatting components. Maintain the tactile editorial DabbaIQ language while prioritizing fast kitchen tasks.

Test search, filters, form validation, stock adjustments, cost calculations, save/cancel, API failure, mobile tables (responsive conversion or controlled horizontal scrolling where suitable), and refresh behavior. Do not replace live API behavior with client-only dummy arrays.
```

## 5C — Sales, Waste, Reports

```text
PHASE 5C — SALES + WASTE + REPORTS.

Implement the exact Stitch Sales Log, Waste Tracker/Food Loss Intelligence, and Business & Operations Reports screens.

Sales: display saved sales records, correct date/period filters, totals derived from the records/API, and working record-sale/import/export actions only where the backend or file flow exists. Validate quantities, prices, dates, and required fields. Ensure an import preview/validation step exists before writing records if import is supported. Clearly show success/failure.

Waste: record waste using the actual supported categories, units, amounts, date/shift, and reason fields. Reconcile it with the backend schema. Summaries and waste metrics must be computed from saved data, not fabricated values. Show clear empty states if no waste is recorded. Export only the visible/current dataset and label its date range.

Reports: use a clear date range with accessible presets; ensure chart series and totals come from the same verified data range; display units/currency consistently; provide descriptive labels and textual summaries so charts are understandable; implement export controls with meaningful filenames. Do not show charts with made-up data just to fill space.

Reuse existing chart dependencies. Ensure chart colors meet contrast needs and align to the approved palette. Avoid dense dashboards with cards that repeat the same metric. Test date boundaries, empty data, filters, totals, exports, API failure, and mobile layout. Verify any numeric calculations against a small controlled test dataset without damaging existing user data.
```

**Phase 5 exit gate:** every primary operational module uses real API data/contracts; every visible action works or is disabled with a truthful explanation; no silent failure.

---

# PHASE 6 — Project Info, Settings, Privacy, Terms

```text
PHASE 6 — PROJECT INFO AND SYSTEM/LEGAL PAGES.

Implement the existing Stitch Settings/System Health, Privacy, and Terms screens. Add a dedicated, navigable /project-info page for evaluator/developer-facing project documentation, using the information architecture and technical-documentation depth of https://twacharakshak.netlify.app/ as a reference for a project information page. Do not copy its text, branding, or page design verbatim. Do not turn the main product homepage into a wall of technologies.

DABBAIQ CUSTOMER-FACING MESSAGE:
Explain the kitchen/tiffin problem, the users it serves, the daily workflow, the value of preparation planning, inventory, recipe costing, sales, waste reduction, and reporting. Lead with what a kitchen operator can achieve, not a list of libraries, models, vendors, or AI terminology.

PROJECT INFO PAGE CONTENT (ground every technical statement in the current repository):
1. Project overview and problem statement.
2. Intended users and core workflows.
3. Feature/module list, with implementation status: working, partially implemented, configured but unverified, planned, or unavailable.
4. Architecture diagram/flow: frontend → API → data stores/services → results, only for connections verified in code.
5. Tech stack grouped by frontend, backend/API, database/storage/time-series, AI/forecasting, workflow/integrations, testing/deployment. Show a technology only if it is genuinely referenced/used by the repository. Distinguish installed library from an integration that is truly connected and exercised.
6. Data flow and how operational records turn into reports/forecasts.
7. API overview with real routes and safe descriptions, not credentials.
8. Local setup using the actual project scripts, .env.example variable names, and prerequisites. Do not reveal .env values.
9. Known limitations, fallback behavior, and what is not yet implemented.
10. Privacy/security notes aligned to real code behavior; avoid legal or absolute guarantees that are not proven.

The page should be easy to scan: project navigation, section anchors, readable diagrams/tables, code snippets only where useful, and a “Back to Dashboard” action. Technical details belong here instead of being repeated across every page. Keep the general landing/story page focused on the kitchen value proposition.

Settings/system health: show state based on real health checks. Separate “configured”, “reachable”, and “functional/integration test passed”; do not mark a connection as healthy simply because it has an environment variable or a 200 response from a generic health route. Redact secret values.

Privacy/Terms: inspect and preserve valid existing project wording where available. Do not fabricate claims like zero data transmission, local-only AI, guaranteed security, regulatory compliance, or legal advice. Mark draft copy for human review where necessary. Keep accessibility and readable typography. Verify every internal link and policy section.
```

**Phase 6 exit gate:** Project Info truthfully documents the real implementation; tech-stack details are not cluttering the main user-facing story; privacy/terms contain no unsupported absolute guarantees.

---

# PHASE 7 — Interaction audit, responsive accessibility, visual fidelity

```text
PHASE 7 — FULL APP INTERACTION AND VISUAL FIDELITY AUDIT.

Do not add new features unless required to close a tested gap. Use the Stitch manifest to compare each intended route/state against the original design.

For each of the 26 Stitch screens, report its implementation mapping and capture current app screenshots at the matching viewport/state. A screen may map to a story section, route state, or mobile breakpoint rather than a new URL; explain that in the map. Compare layout hierarchy, dimensions/proportions, type scale, color, imagery, borders/shadows, information density, and behavior. Fix the largest differences first.

Functional sweep every route:
- Navigate to it from the UI, reload it directly, and use browser back/forward.
- Click every button/link; submit each form with valid and invalid values; test modal open/cancel/save; test filters, tabs, sliders, search, sorting, export/download, and navigation menus.
- Check request payloads and responses. Confirm no important form uses an inert `onClick`, a `href="#"`, a TODO handler, a fake timeout, or a client-only write that pretends to persist data.
- Verify loading, empty, error, offline, success, and recovery states.
- Confirm the visible data matches server responses and units/date/currency calculations are accurate.
- Confirm no secret/PII is rendered in UI or logs.

Responsive/accessibility sweep:
- Test at minimum 1440×900, 1024×768, 768×1024, 390×844, and 360×800 viewports, or close available browser sizes.
- No unintended horizontal body scroll, cut-off primary action, overlapping dialog, inaccessible dropdown, clipped headline, or unlabelled icon-only control.
- Verify keyboard tab order, visible focus, Enter/Space behavior, Escape for dialogs/menus, meaningful button/link names, form labels, alt text, and reduced-motion behavior.
- Check contrast, chart labels, table semantics, and touch target size.

Performance sweep:
- Look for huge unnecessary client bundles, unoptimized imagery, repeated renders, scroll jank, leaking subscriptions/listeners, endless animation, layout shift, and 3D context errors. Pause expensive 3D rendering when not in use.

Do not claim 26/26 fidelity if any screen has not been inspected. Create docs/implementation/visual-regression.md with one row per Stitch screen, source path/ID, implementation route/state, screenshot path, status, difference, and fix. Run existing lint, typecheck, unit tests, production build, and browser/e2e tests if present. If a test is absent, record “not available” rather than “passed.”
```

**Phase 7 exit gate:** all 26 mappings are accounted for; every route and primary interaction is tested; visual differences are recorded; critical defects are fixed.

---

# PHASE 8 — Final verification, documentation, and handoff

```text
PHASE 8 — FINAL RELEASE GATE. DO NOT CLAIM SUCCESS WITHOUT EVIDENCE.

Run the actual scripts defined in the repository for lint, typecheck, unit tests, production build, and e2e/browser tests. Start the real backend and frontend through the documented commands and verify user-critical flows from the browser. Do not use HTTP 200 status checks as the only evidence of completion.

Required end-to-end flows, adapted to the actual backend schema:
1. Open the landing story; scroll forward and backward; use a section CTA; skip to the dashboard.
2. Navigate between all operational routes from desktop navigation and mobile navigation.
3. Load real dashboard data or a truthful empty state.
4. Run/inspect a preparation plan with a real API result or a truthful failure state.
5. Read inventory, perform a safe test stock adjustment only with an explicitly disposable test record/environment, and verify the saved result.
6. View recipes and validate the recipe cost math against ingredient prices when present.
7. Record or validate a sale and waste item only in a safe test environment, then verify it appears in history/reports.
8. Change report date ranges and verify metrics/exports correspond to the selected range.
9. Open Project Info and confirm its tech stack and claims match the actual source code.
10. Open Settings, Privacy, Terms and verify working links and truthful integration status.

Never modify/delete production/user records to test. If a separate test database is not configured, test read paths and validation in a controlled way; do not write sample data to the user's live database.

Check browser console, server logs, failed requests, accessibility, mobile layout, 3D fallback, and reduced motion. Fix release-blocking issues. Inspect `git diff --check` and the full diff. Do not commit or push unless explicitly asked by the user.

Update README and documentation with accurate architecture, installation, environment variable names, services, test commands, and known issues. Never include secrets.

Create docs/implementation/final-release-report.md containing:
- All 26 Stitch screen IDs and titles with mapping and validation status.
- All application routes and mobile/desktop variants.
- Files changed and why.
- Implemented interactions vs unavailable/partial interactions.
- Actual lint/typecheck/build/test command outputs and exit codes.
- Browser testing and screenshot paths.
- Real integration status with evidence; distinguish configured/reachable/functional.
- Known differences from Stitch and remaining defects.
- Exact local run instructions and manual configuration still required.

Do not say “100% complete” unless every release gate actually passes. Clearly separate verified success, partial implementation, failed checks, and untested items.
```

---

# Emergency recovery prompt — if Antigravity stops halfway or claims it is finished too early

```text
RESUME DABBAIQ WITHOUT LOSING WORK.

Read docs/design/stitch-screen-manifest.md, docs/implementation/current-state-audit.md, docs/implementation/screen-route-api-map.md, docs/implementation/visual-regression.md, the latest final-release report if present, git status, and the current test output. Verify the files and claims instead of trusting the previous agent message.

Do not recreate completed work and do not reset/overwrite the repository. Identify the earliest unfinished acceptance gate from Phases 0–8. Continue from that exact point. Prioritize missing screens, dead navigation, nonfunctional controls, incorrect/fake data, 3D scroll/route transitions, and build/runtime failures. Re-run the relevant tests after each fix. Continue until every phase’s exit gate is met or there is a precise external blocker. Record evidence; do not claim success based on HTTP 200 alone.
```

---

# Suggested execution order at a glance

1. Connect MCP and confirm exact project ID.
2. Inventory/export all 26 Stitch screens.
3. Audit codebase and map routes/APIs.
4. Fix design system and navigation first.
5. Build the sticky scroll-driven tiffin story and route CTAs.
6. Implement Dashboard/Planner.
7. Implement Inventory/Recipes.
8. Implement Sales/Waste/Reports.
9. Add truthful Project Info + Settings/Privacy/Terms.
10. Test every screen, action, viewport, API flow, and visual difference.
11. Produce a verified final handoff report.

**Key principle:** the Stitch project determines how it should look; the repository and backend determine what it can truthfully do. Keep those connected without allowing the agent to invent either one.
