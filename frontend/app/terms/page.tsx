'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, Scale, ShieldAlert, ArrowLeft, CheckCircle2, Building2, Terminal, ShieldCheck } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb Back Link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-mono font-semibold text-primary transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Master Kitchen Ops Desk
        </Link>
      </div>

      {/* Header Deck */}
      <div className="desk-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary-container text-white flex items-center justify-center shadow-[0_2px_0_0_#18542a]">
            <Scale className="w-6 h-6 text-tertiary-fixed" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-headline font-bold text-primary tracking-tight">
                Terms of Service &amp; Operational License
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded-xs bg-primary text-white font-bold">
                COMMERCIAL LICENSE
              </span>
            </div>
            <p className="font-mono text-xs text-on-surface-variant mt-0.5">
              DabbaIQ Master Kitchen Desk • Hacktoberfest 2026 Open-Weight AI Architecture
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-surface-container-low border border-outline-variant/40 rounded-xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-xs text-on-surface-variant space-y-1 font-body">
            <span className="font-headline font-bold text-primary block text-sm">
              Operational Scope &amp; Commercial Acceptance:
            </span>
            <p>
              By accessing, deploying, or operating the DabbaIQ Master Kitchen Desk, you agree to these operational terms.
              DabbaIQ is engineered for commercial cloud kitchens, caterers, and Indian tiffin distribution services to
              minimize food waste and streamline ingredient procurement.
            </p>
          </div>
        </div>
      </div>

      {/* License & Subsystems Grid */}
      <div className="desk-card p-6 space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-headline font-bold text-primary border-b border-outline-variant/30 pb-2">
            1. Open-Weight Model &amp; Ecosystem Subsystems
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="p-3.5 bg-surface-container-low border border-outline-variant/40 rounded-lg space-y-1">
              <span className="font-headline font-bold text-xs text-on-surface block">
                Gemma 2 Open-Weight Model (Google DeepMind)
              </span>
              <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                Operated under the official Gemma Terms of Use. Gemma executes on-premise for kitchen planning reasoning and menu copywriting without cloud data transmission.
              </p>
            </div>

            <div className="p-3.5 bg-surface-container-low border border-outline-variant/40 rounded-lg space-y-1">
              <span className="font-headline font-bold text-xs text-on-surface block">
                SerpAPI (Google Shopping Wholesale Index)
              </span>
              <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                Operated under the SerpAPI Terms of Service. Market price data queried via SerpAPI is for internal procurement benchmarking and cost optimization only.
              </p>
            </div>

            <div className="p-3.5 bg-surface-container-low border border-outline-variant/40 rounded-lg space-y-1">
              <span className="font-headline font-bold text-xs text-on-surface block">
                Tiger Data (TimescaleDB / PostgreSQL)
              </span>
              <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                TimescaleDB hypertable time-series snapshots utilized for append-only procurement price volatility analytics under the Timescale License.
              </p>
            </div>

            <div className="p-3.5 bg-surface-container-low border border-outline-variant/40 rounded-lg space-y-1">
              <span className="font-headline font-bold text-xs text-on-surface block">
                Temporal Distributed Workflow Engine
              </span>
              <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                Planning pipeline activities and deterministic retry execution governed by the Temporal Python SDK under the MIT License.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-headline font-bold text-primary border-b border-outline-variant/30 pb-2">
            2. Culinary Authority &amp; Non-Deterministic Forecasts
          </h2>
          <p className="font-body text-xs text-on-surface-variant leading-relaxed">
            DabbaIQ employs statistical moving averages, linear regressions, and Gemma AI contextual interpretations to estimate preparation volumes. All recommendations are advisory. The head chef or commercial kitchen manager retains absolute and final authority on batch quantities, seasoning, and allergen segregation.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-headline font-bold text-primary border-b border-outline-variant/30 pb-2">
            3. High-Velocity Offline Contingency
          </h2>
          <p className="font-body text-xs text-on-surface-variant leading-relaxed">
            In the event of network connectivity interruptions to local MongoDB or cloud integrations during peak dispatch hours (11:30–14:30 IST), kitchens must maintain physical printed rail slips and fallback batch tallies. DabbaIQ accepts offline reconciliation uploads via CSV once connection is restored.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-headline font-bold text-primary border-b border-outline-variant/30 pb-2">
            4. Food-Safety Compliance &amp; Limitations of Liability
          </h2>
          <div className="p-4 bg-tertiary-fixed/30 border border-tertiary/30 rounded-xl text-xs text-on-surface-variant flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-tertiary mt-0.5" />
            <div className="space-y-1 font-body">
              <p className="font-bold text-on-surface">Critical Operational Boundary:</p>
              <p className="leading-relaxed">
                DabbaIQ does not warrant compliance with local municipal health inspection codes, FSSAI certifications, or microbial safety standards. The kitchen operator assumes sole responsibility for hygiene, storage temperature, expiry inspections, and customer dietary disclosures.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-2 border-t border-outline-variant/30 pt-4">
          <h2 className="text-base font-headline font-bold text-on-surface">5. Modification &amp; Maintenance</h2>
          <p className="font-mono text-xs text-on-surface-variant">
            These terms may be updated alongside major software version releases. Continued use of the DabbaIQ Master Kitchen Desk signifies acceptance of modified operational terms.
          </p>
        </section>
      </div>
    </div>
  );
}
