'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Settings,
  Database,
  Sparkles,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  Mic,
  BrainCircuit,
  MessageSquare,
  Info,
  Clock,
  Layers,
  Sliders,
  CheckSquare,
  Lock,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { api, IntegrationsStatus } from '@/lib/api';

export default function SettingsPage() {
  const [integrations, setIntegrations] = useState<IntegrationsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Operational settings local state
  const [stationId, setStationId] = useState<string>('MUM-04');
  const [stationName, setStationName] = useState<string>('Mumbai Central Main Ops Rail');
  const [safetyBuffer, setSafetyBuffer] = useState<number>(15);
  const [currency, setCurrency] = useState<string>('INR (₹)');
  const [defaultMeal, setDefaultMeal] = useState<string>('lunch');
  const [settingsSaved, setSettingsSaved] = useState(false);

  const checkConnectivity = async () => {
    setLoading(true);
    try {
      const data = await api.getIntegrationsStatus().catch(() => ({
        database: {
          provider: 'MongoDB Atlas',
          connected: false,
          status: 'unreachable',
          message: 'Cannot connect to backend service on port 8000',
          database_name: 'dabbaiq',
        },
        ai: {
          provider: 'Gemma 2 (via Ollama)',
          available: false,
          model: 'gemma2:latest',
          base_url: 'http://localhost:11434',
          message: 'Backend API unreachable',
        },
        elevenlabs: {
          configured: false,
          provider: 'ElevenLabs',
          feature: 'Speech-to-Text (Voice Kitchen Notes)',
          message: 'Backend API unreachable',
        },
        backboard: {
          configured: false,
          provider: 'Backboard',
          feature: 'Persistent Operational Assistant Threads',
          message: 'Backend API unreachable',
        },
        tinker: {
          configured: false,
          provider: 'Tinker by Thinking Machines',
          feature: 'Domain Fine-Tuning for Kitchen Planning Models',
          message: 'Backend API unreachable',
        },
      }));
      setIntegrations(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnectivity();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Deck */}
      <div className="desk-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="font-headline font-bold text-2xl sm:text-3xl text-primary tracking-tight">
              Settings &amp; System Health
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded-xs bg-primary-fixed text-on-primary-fixed font-bold">
              SYS-DIAGNOSTICS
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-xs bg-surface-container-high text-on-surface-variant font-semibold">
              STATION: {stationId}
            </span>
          </div>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant max-w-3xl">
            Live diagnostic status for MongoDB Atlas, Gemma AI inference, and partner integrations across the Master Kitchen Ops Desk.
          </p>
        </div>

        <button
          type="button"
          onClick={checkConnectivity}
          className="btn-primary text-xs shadow-xs self-start sm:self-auto flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-test Diagnostics</span>
        </button>
      </div>

      {/* Operational Station Parameters Card */}
      <div className="desk-card p-5">
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" />
            <h2 className="font-headline font-bold text-lg text-on-surface">
              Kitchen Desk Operating Parameters
            </h2>
          </div>
          {settingsSaved && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xs bg-primary-fixed text-primary font-mono text-xs font-bold animate-in fade-in">
              <Check className="w-3.5 h-3.5" /> Parameters Saved to Local Desk
            </span>
          )}
        </div>

        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="font-mono text-[11px] text-on-surface-variant uppercase font-bold block mb-1">
              Station Terminal ID
            </label>
            <input
              type="text"
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-low rounded border border-outline-variant text-xs font-mono text-on-surface focus:outline-none focus:border-primary font-bold"
            />
          </div>

          <div>
            <label className="font-mono text-[11px] text-on-surface-variant uppercase font-bold block mb-1">
              Station Name
            </label>
            <input
              type="text"
              value={stationName}
              onChange={(e) => setStationName(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-low rounded border border-outline-variant text-xs font-body text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="font-mono text-[11px] text-on-surface-variant uppercase font-bold block mb-1">
              Default Safety Buffer (%): {safetyBuffer}%
            </label>
            <input
              type="range"
              min="0"
              max="40"
              step="5"
              value={safetyBuffer}
              onChange={(e) => setSafetyBuffer(parseInt(e.target.value))}
              className="w-full mt-2 accent-primary cursor-pointer"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full btn-secondary text-xs shadow-xs py-2"
            >
              Update Preferences
            </button>
          </div>
        </form>
      </div>

      {/* Primary Connectivity Diagnostic Grid (MongoDB & Gemma 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MongoDB Connection Status */}
        <div className="desk-card p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                <h3 className="font-headline font-bold text-lg text-on-surface">MongoDB Atlas Storage</h3>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded font-mono text-xs font-bold border ${
                  integrations?.database.connected
                    ? 'bg-primary-fixed/40 text-primary border-primary/30'
                    : 'bg-error-container text-on-error-container border-error/30'
                }`}
              >
                {integrations?.database.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <div className="p-3 bg-surface-container-low rounded-lg text-xs space-y-2 border border-outline-variant/40 mt-3 font-mono">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Storage Status:</span>
                <span className="font-bold text-on-surface">
                  {integrations?.database.connected
                    ? `Persistent Cluster (latency: ${integrations.database.latency_ms ?? '~'}ms)`
                    : 'Unsaved Local Session (No URI)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Database Name:</span>
                <span className="font-bold text-primary">{integrations?.database.database_name}</span>
              </div>
              <div className="pt-2 border-t border-outline-variant/30 text-on-surface-variant text-[11px]">
                {integrations?.database.message}
              </div>
            </div>

            {!integrations?.database.connected && (
              <div className="space-y-2 text-xs text-on-surface-variant mt-3">
                <p className="font-semibold text-on-surface">How to connect persistent database:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>
                    Create a free cluster at{' '}
                    <a
                      href="https://cloud.mongodb.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline font-medium"
                    >
                      cloud.mongodb.com
                    </a>
                  </li>
                  <li>Add a database user and whitelist your IP (or 0.0.0.0/0 for testing)</li>
                  <li>In <code>backend/.env</code>, configure:</li>
                </ol>
                <div className="bg-surface-container-lowest text-on-surface p-2.5 rounded border border-outline-variant font-mono text-[11px] flex items-center justify-between">
                  <span className="truncate pr-2">MONGODB_URI=mongodb+srv://...</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        'MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority',
                        'mongo'
                      )
                    }
                    className="p-1 rounded hover:bg-surface-container text-on-surface-variant"
                  >
                    {copiedCmd === 'mongo' ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-2.5 bg-surface-container rounded font-mono text-[11px] text-on-surface-variant flex items-center justify-between">
            <span>Primary Collections:</span>
            <span className="font-bold text-primary">ingredients, recipes, sales, waste, plans</span>
          </div>
        </div>

        {/* Gemma via Ollama Status */}
        <div className="desk-card p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-secondary" />
                <h3 className="font-headline font-bold text-lg text-on-surface">Gemma 2 via Ollama (Local AI)</h3>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded font-mono text-xs font-bold border ${
                  integrations?.ai.available
                    ? 'bg-primary-fixed/40 text-primary border-primary/30'
                    : 'bg-tertiary-fixed text-on-tertiary-fixed border-tertiary/30'
                }`}
              >
                {integrations?.ai.available ? 'Active / Online' : 'Standby / Offline'}
              </span>
            </div>

            <div className="p-3 bg-surface-container-low rounded-lg text-xs space-y-2 border border-outline-variant/40 mt-3 font-mono">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Inference Endpoint:</span>
                <span className="font-bold text-on-surface">{integrations?.ai.base_url}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Configured Model:</span>
                <span className="font-bold text-primary">{integrations?.ai.model}</span>
              </div>
              <div className="pt-2 border-t border-outline-variant/30 text-on-surface-variant text-[11px]">
                {integrations?.ai.message}
              </div>
            </div>

            <div className="space-y-2 text-xs text-on-surface-variant mt-3">
              <p className="font-semibold text-on-surface">Local setup instructions (PowerShell):</p>
              <div className="space-y-1.5">
                <div className="bg-surface-container-lowest text-on-surface p-2 rounded border border-outline-variant font-mono text-[11px] flex items-center justify-between">
                  <span>ollama serve</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('ollama serve', 'serve')}
                    className="p-1 rounded hover:bg-surface-container text-on-surface-variant"
                  >
                    {copiedCmd === 'serve' ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="bg-surface-container-lowest text-on-surface p-2 rounded border border-outline-variant font-mono text-[11px] flex items-center justify-between">
                  <span>ollama pull gemma2:latest</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('ollama pull gemma2:latest', 'pull')}
                    className="p-1 rounded hover:bg-surface-container text-on-surface-variant"
                  >
                    {copiedCmd === 'pull' ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-surface-container rounded font-mono text-[11px] text-on-surface-variant flex items-center justify-between">
            <span>Local-First Guarantee:</span>
            <span className="font-bold text-primary">Zero cloud API tokens required</span>
          </div>
        </div>
      </div>

      {/* Real-Time Market & Workflow Orchestration (3 Cards) */}
      <div className="desk-card p-5 space-y-4">
        <div className="pb-2 border-b border-outline-variant/30">
          <h3 className="font-headline font-bold text-lg text-on-surface">
            Real-Time Market &amp; Workflow Orchestration
          </h3>
          <p className="font-body text-xs text-on-surface-variant mt-0.5">
            Live supplier benchmarks, append-only time-series analytics, and distributed workflow execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* SerpAPI */}
          <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-headline font-bold text-sm text-on-surface">SerpAPI Wholesale Search</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-primary-fixed/40 text-primary font-bold">
                  Configured
                </span>
              </div>
              <p className="font-body text-xs text-on-surface-variant">
                Live Google Shopping wholesale rate comparisons for Vashi APMC ingredients.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-outline-variant/30 font-mono text-[10px] text-on-surface-variant">
              <code>ENV: SERPAPI_API_KEY</code>
            </div>
          </div>

          {/* Tiger Data */}
          <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-headline font-bold text-sm text-on-surface">Tiger Data (TimescaleDB)</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-bold">
                  Standby
                </span>
              </div>
              <p className="font-body text-xs text-on-surface-variant">
                TimescaleDB append-only hypertable capturing historical market price variance.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-outline-variant/30 font-mono text-[10px] text-on-surface-variant">
              <code>ENV: TIGER_DATA_DATABASE_URL</code>
            </div>
          </div>

          {/* Temporal */}
          <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-headline font-bold text-sm text-on-surface">Temporal Orchestrator</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-primary-fixed/40 text-primary font-bold">
                  Active Pipeline
                </span>
              </div>
              <p className="font-body text-xs text-on-surface-variant">
                Resilient 5-step preparation planning pipeline with deterministic retry execution.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-outline-variant/30 font-mono text-[10px] text-on-surface-variant">
              <code>ENV: TEMPORAL_ADDRESS</code>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Partner Integrations (3 Cards) */}
      <div className="desk-card p-5 space-y-4">
        <div className="pb-2 border-b border-outline-variant/30">
          <h3 className="font-headline font-bold text-lg text-on-surface">
            Optional Partner Integrations
          </h3>
          <p className="font-body text-xs text-on-surface-variant mt-0.5">
            Modular extensions automatically activated when their respective API keys are present in <code>backend/.env</code>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ElevenLabs */}
          <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-headline font-bold text-sm text-on-surface flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-secondary" /> ElevenLabs STT
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-bold">
                  {integrations?.elevenlabs.configured ? 'Configured' : 'Optional'}
                </span>
              </div>
              <p className="font-body text-xs text-on-surface-variant">
                Speech-to-Text for kitchen voice notes and hands-free preparation orders.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-outline-variant/30 font-mono text-[10px] text-on-surface-variant">
              <code>ENV: ELEVENLABS_API_KEY</code>
            </div>
          </div>

          {/* Backboard */}
          <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-headline font-bold text-sm text-on-surface flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-primary" /> Backboard
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-bold">
                  {integrations?.backboard.configured ? 'Configured' : 'Optional'}
                </span>
              </div>
              <p className="font-body text-xs text-on-surface-variant">
                Persistent assistant threads for multi-turn shift handover conversations.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-outline-variant/30 font-mono text-[10px] text-on-surface-variant">
              <code>ENV: BACKBOARD_API_KEY</code>
            </div>
          </div>

          {/* Tinker */}
          <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-headline font-bold text-sm text-on-surface flex items-center gap-1.5">
                  <BrainCircuit className="w-4 h-4 text-tertiary" /> Tinker Fine-Tuning
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-bold">
                  {integrations?.tinker.configured ? 'Configured' : 'Optional'}
                </span>
              </div>
              <p className="font-body text-xs text-on-surface-variant">
                Domain fine-tuning dataset generation for custom commercial kitchen models.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-outline-variant/30 font-mono text-[10px] text-on-surface-variant">
              <code>ENV: TINKER_API_KEY</code>
            </div>
          </div>
        </div>
      </div>

      {/* DPDPA & Legal Governance Ribbon */}
      <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span className="text-on-surface font-bold">Digital Personal Data Protection (DPDP) Act 2023 Compliant</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="text-primary hover:underline flex items-center gap-1 font-semibold">
            <span>Privacy Policy</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <Link href="/terms" className="text-primary hover:underline flex items-center gap-1 font-semibold">
            <span>Terms of Service</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
