'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Lock, FileText, ArrowLeft, AlertCircle, CheckCircle2, ShieldCheck, Database, Sparkles, QrCode } from 'lucide-react';

export default function PrivacyPage() {
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
            <ShieldCheck className="w-6 h-6 text-tertiary-fixed" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-headline font-bold text-primary tracking-tight">
                Privacy Notice &amp; Data Governance
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded-xs bg-primary text-white font-bold">
                DPDPA 2023
              </span>
            </div>
            <p className="font-mono text-xs text-on-surface-variant mt-0.5">
              Version 2.4-BETA • In Compliance with India Digital Personal Data Protection Act, 2023
            </p>
          </div>
        </div>

        {/* DPDP Act Compliance Notice Banner */}
        <div className="mt-4 p-4 bg-primary-fixed/30 border border-primary/30 rounded-xl flex items-start gap-3">
          <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-xs text-on-surface-variant space-y-1 font-body">
            <span className="font-headline font-bold text-primary block text-sm">
              Digital Personal Data Protection Act (DPDP), 2023 Disclosure:
            </span>
            <p>
              In alignment with the Digital Personal Data Protection Act, 2023 enacted by the Ministry of Electronics and
              Information Technology (MeitY), Government of India, DabbaIQ enforces data minimization, local processing,
              and strict purpose limitation for all Indian commercial kitchen operations.
            </p>
          </div>
        </div>
      </div>

      {/* Core Privacy Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="desk-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-primary font-headline font-bold text-sm">
            <Database className="w-4 h-4" />
            <span>Local &amp; Isolated Data Storage</span>
          </div>
          <p className="font-body text-xs text-on-surface-variant leading-relaxed">
            All inventory logs, recipe bills of materials, and customer dispatch tallies are stored securely in dedicated MongoDB Atlas database collections. Third-party credentials remain exclusively server-side.
          </p>
        </div>

        <div className="desk-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-secondary font-headline font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>On-Premise Gemma AI Inference</span>
          </div>
          <p className="font-body text-xs text-on-surface-variant leading-relaxed">
            Culinary reasoning, menu copywriting, and kitchen note parsing execute locally via Ollama. No proprietary kitchen secret recipes or vendor rates are transmitted to public model training datasets.
          </p>
        </div>
      </div>

      {/* Detailed Sections */}
      <div className="desk-card p-6 space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-headline font-bold text-primary border-b border-outline-variant/30 pb-2">
            1. Categories of Data Processed
          </h2>
          <ul className="list-disc pl-5 space-y-2 font-body text-xs text-on-surface-variant leading-relaxed">
            <li>
              <strong className="text-on-surface">Operational Kitchen Data:</strong> Raw ingredient stock weights, pantry unit purchase costs, recipe BOM allocations, and meal dispatch counts.
            </li>
            <li>
              <strong className="text-on-surface">Market Pricing Benchmarks:</strong> Ingredient keywords queried through SerpAPI (Google Shopping). Searches contain strictly raw commodity descriptions (e.g. &ldquo;toor dal 50kg wholesale&rdquo;) and zero PII.
            </li>
            <li>
              <strong className="text-on-surface">Append-Only Procurement History:</strong> Historical price snapshots recorded in Tiger Data (TimescaleDB) to graph inflation variance without external telemetry leakage.
            </li>
            <li>
              <strong className="text-on-surface">Voice Kitchen Notes (Optional):</strong> Head chef speech recordings transcribed via ElevenLabs STT. Transcripts are converted into draft orders requiring explicit physical chef confirmation before saving.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-headline font-bold text-primary border-b border-outline-variant/30 pb-2">
            2. Secret Isolation &amp; Zero Client Exposure
          </h2>
          <p className="font-body text-xs text-on-surface-variant leading-relaxed">
            Database connection strings (MongoDB Atlas), SerpAPI keys, and Temporal configuration addresses are held strictly in server-side process environments. Client-side browser bundles contain no sensitive keys or administrative secrets.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-headline font-bold text-primary border-b border-outline-variant/30 pb-2">
            3. Right to Export &amp; Data Erasure
          </h2>
          <p className="font-body text-xs text-on-surface-variant leading-relaxed">
            Under Section 12 of the DPDP Act 2023, data principals maintain the absolute right to receive their operational logs in standard machine-readable formats. DabbaIQ provides one-click CSV data export stations for Sales, Waste, and Inventory on the Reports desk.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-headline font-bold text-primary border-b border-outline-variant/30 pb-2">
            4. Food-Safety &amp; Culinary Boundary Disclaimer
          </h2>
          <div className="p-4 bg-tertiary-fixed/30 border border-tertiary/30 rounded-xl text-xs text-on-surface-variant flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-tertiary mt-0.5" />
            <p className="font-body leading-relaxed">
              DabbaIQ preparation forecasts, safety buffers, and scrap recommendations are algorithmic planning aids. They do not supersede statutory food hygiene regulations (including FSSAI standards), perishable cold-chain temperature thresholds, or professional culinary chef discretion.
            </p>
          </div>
        </section>

        <section className="space-y-2 border-t border-outline-variant/30 pt-4">
          <h2 className="text-base font-headline font-bold text-on-surface">5. Data Protection Officer (DPO) Contact</h2>
          <p className="font-mono text-xs text-on-surface-variant">
            For governance inquiries or audit requests, please file a ticket via the official DabbaIQ Hacktoberfest repository issue tracker or contact your designated station administrator at <code>governance@dabbaiq.local</code>.
          </p>
        </section>
      </div>
    </div>
  );
}
