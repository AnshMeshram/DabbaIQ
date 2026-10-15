# Third-Party Notices & Open-Source Licenses

DabbaIQ incorporates open-source and open-weight software components. This document provides notice of the licenses and terms governing these dependencies.

---

## 1. Open-Weight AI Models

### Gemma 3 & Gemma 2 (Google DeepMind)
- **License / Terms:** Gemma Terms of Use & Prohibited Use Policy
- **Type:** Open-weight commercial-friendly license with responsible AI restrictions.
- **Usage in DabbaIQ:** Local inference via Ollama for structured menu suggestions from confirmed sales data and ingredient stock.
- **Reference:** https://ai.google.dev/gemma/terms

---

## 2. Infrastructure & Partner Integrations

### SerpAPI (Google Shopping & Google Search)
- **Service:** Real-time search engine results API.
- **Terms:** SerpAPI Terms of Service.
- **Usage in DabbaIQ:** Server-side search for wholesale ingredient suppliers and live price benchmarking. Never receives customer personal identifiable information (PII).

### Tiger Data (TimescaleDB / PostgreSQL)
- **License:** Timescale Community License (TimescaleDB) and PostgreSQL License.
- **Usage in DabbaIQ:** Append-only time-series hypertable (`dabbaiq_price_snapshots`) storing market price observations and price trend analytics.

### Temporal Technologies
- **License:** MIT License (Temporal Python SDK)
- **Usage in DabbaIQ:** Distributed workflow orchestration coordinating kitchen context retrieval, deterministic forecasting, price search, and draft plan creation.

### ElevenLabs
- **Service:** Speech-to-Text Audio Transcription API.
- **Terms:** ElevenLabs Terms of Service.
- **Usage in DabbaIQ:** Optional transcription for recorded kitchen voice notes, with explicit user confirmation required before saving.

---

## 3. Core Software Libraries

| Library | License | Purpose |
|---|---|---|
| **FastAPI** | MIT | High-performance Python backend API framework |
| **Pydantic v2** | MIT | Data parsing and validation |
| **PyMongo / Motor** | Apache 2.0 | Asynchronous MongoDB driver |
| **asyncpg** | Apache 2.0 | Asynchronous PostgreSQL client library |
| **Temporalio** | MIT | Temporal Python SDK |
| **Next.js** | MIT | React full-stack web framework |
| **React 19** | MIT | UI component library |
| **Zod** | MIT | TypeScript-first schema validation |
| **Zustand** | MIT | Client-side state management |
| **Lucide Icons** | ISC | UI iconography |
| **Recharts** | MIT | Time-series charting and data visualization |

---

## 4. Statutory & Regulatory Notices

### Digital Personal Data Protection Act (DPDP), 2023 (MeitY)
DabbaIQ adheres to the principles of purpose specification, data minimization, and secure storage outlined under the DPDP Act 2023. Technical safeguards in this repository are architectural starting points and do not constitute legal compliance guarantees.

### Food Safety Notice
DabbaIQ provides prep forecasting and price comparisons. It does not replace applicable food-safety standards (e.g. FSSAI in India, FDA, HACCP) or professional culinary oversight.
