import React from 'react';
import Link from 'next/link';
import { Shield, Lock, FileText, ArrowLeft, AlertCircle } from 'lucide-react';

export default function PrivacyPage() {
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
            <Shield className="w-8 h-8 text-emerald-400" />
            <h1 className="text-3xl font-extrabold text-white">Privacy Notice &amp; Data Governance</h1>
          </div>
          <p className="text-sm text-slate-400">
            Last Updated: October 2026 • DabbaIQ Kitchen Management Platform
          </p>
        </div>

        {/* DPDP Act Compliance Notice */}
        <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl flex items-start gap-3">
          <Lock className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 space-y-1">
            <span className="font-bold text-white block">Digital Personal Data Protection Act (DPDP), 2023 Disclosure:</span>
            <p>
              In alignment with the Digital Personal Data Protection Act, 2023 enacted by the Ministry of Electronics and
              Information Technology (MeitY), Government of India, DabbaIQ enforces data minimization and purpose limitation.
              Technical safeguards and templates provided in this MVP are not a substitute for formal legal audit prior to
              commercial rollout.
            </p>
          </div>
        </div>

        <section className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-lg font-bold text-white">1. Categories of Data Processed</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Operational Kitchen Data:</strong> Ingredient quantities, cost benchmarks, recipes, meal schedules,
              and anonymous daily portion sales counts. Stored securely in MongoDB Atlas.
            </li>
            <li>
              <strong>Market Pricing Queries:</strong> Ingredient name and packaging unit sent to SerpAPI (Google Shopping).
              Search queries never contain consumer PII, personal kitchen notes, or financial credentials.
            </li>
            <li>
              <strong>Time-Series Price Snapshots:</strong> Append-only historical pricing records stored in Tiger Data (TimescaleDB)
              to compute economic variance and inflation trends.
            </li>
            <li>
              <strong>Voice Kitchen Notes (Optional):</strong> Audio files uploaded for speech-to-text transcription via ElevenLabs.
              Audio is transmitted strictly with explicit user consent and parsed into draft proposals requiring manual confirmation.
            </li>
            <li>
              <strong>AI Model Inference:</strong> Local open-weight Gemma model inference running via Ollama. No recipe data is
              sold or transmitted to closed third-party model training pipelines.
            </li>
          </ul>
        </section>

        <section className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-lg font-bold text-white">2. Secret Management &amp; Server-Side Protection</h2>
          <p>
            All third-party credentials (MongoDB Atlas connection string, SerpAPI key, Tiger Data URL, ElevenLabs key)
            are strictly isolated on the backend server within environment variables. Client bundles and web browsers never
            receive or store database passwords or API keys.
          </p>
        </section>

        <section className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-lg font-bold text-white">3. Retention, Export &amp; Deletion Rights</h2>
          <p>
            Users maintain full ownership of their data. In accordance with data fiduciary standards:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Sales records and inventory data can be exported in CSV format via the Reports module.</li>
            <li>Users can request immediate erasure of demo and production data.</li>
          </ul>
        </section>

        <section className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-lg font-bold text-white">4. Food-Safety &amp; Operational Disclaimer</h2>
          <div className="p-4 bg-amber-950/20 border border-amber-800/30 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
            <p>
              DabbaIQ provides algorithmic preparation forecasting and market benchmarks. It does not replace applicable
              food-safety certifications (including Food Safety and Standards Authority of India - FSSAI regulations),
              perishable temperature protocols, allergen labeling, or professional culinary judgment.
            </p>
          </div>
        </section>

        <section className="space-y-2 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-lg font-bold text-white">5. Contact Information</h2>
          <p>
            For privacy inquiries, data deletion requests, or compliance auditing, reach out to the project maintainers
            via the GitHub repository issue tracker or your dedicated organization administrator.
          </p>
        </section>
      </div>
    </div>
  );
}
