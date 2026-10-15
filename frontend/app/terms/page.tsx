import React from 'react';
import Link from 'next/link';
import { FileText, Scale, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to DabbaIQ Dashboard
        </Link>

        <div className="border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <Scale className="w-8 h-8 text-emerald-400" />
            <h1 className="text-3xl font-extrabold text-white">Terms of Service &amp; Model Licensing</h1>
          </div>
          <p className="text-sm text-slate-400">
            DabbaIQ • Hacktoberfest 2026 Open-Source AI Challenge
          </p>
        </div>

        <section className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-lg font-bold text-white">1. Service Acceptance</h2>
          <p>
            By accessing or operating DabbaIQ, you agree to these Terms of Service. DabbaIQ is an open-source software
            project developed for tiffin business owners, commercial kitchens, and caterers to reduce operational food waste
            and optimize ingredient procurement.
          </p>
        </section>

        <section className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-lg font-bold text-white">2. Open-Weight Model &amp; Third-Party Licensing</h2>
          <div className="space-y-3">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="font-semibold text-white block">Gemma Model (Google DeepMind):</span>
              <p className="text-xs text-slate-400 mt-1">
                Operated under the Gemma Terms of Use. Gemma is an open-weight model family. Use of Gemma must comply
                with the Google Prohibited Use Policy. DabbaIQ uses Gemma solely for grounded menu recommendations and
                kitchen note parsing.
              </p>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="font-semibold text-white block">SerpAPI (Google Shopping &amp; Search):</span>
              <p className="text-xs text-slate-400 mt-1">
                Operated under the SerpAPI Terms of Service. Market price data retrieved via SerpAPI is for internal benchmarking
                and procurement comparison only.
              </p>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="font-semibold text-white block">Tiger Data (TimescaleDB / PostgreSQL):</span>
              <p className="text-xs text-slate-400 mt-1">
                PostgreSQL and TimescaleDB Community components utilized for hypertable time-series price snapshots under the
                Timescale License and PostgreSQL License.
              </p>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="font-semibold text-white block">Temporal Python SDK:</span>
              <p className="text-xs text-slate-400 mt-1">
                Temporal workflow engine and Python SDK licensed under the MIT License.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-lg font-bold text-white">3. Disclaimers &amp; Limitation of Liability</h2>
          <div className="p-4 bg-amber-950/20 border border-amber-800/30 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Critical Food-Safety &amp; Inventory Disclaimer:</p>
              <p>
                DabbaIQ does not provide certified culinary advice, food allergen guarantees, or statutory health safety
                certifications. Users are solely responsible for verifying ingredient shelf-life, hygiene standards, supplier
                invoices, and compliance with local municipal and food safety authorities.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
