'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { api, IntegrationsStatus } from '@/lib/api';

export default function SettingsPage() {
  const [integrations, setIntegrations] = useState<IntegrationsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Business settings local preview
  const [safetyBuffer, setSafetyBuffer] = useState<number>(15);
  const [currency, setCurrency] = useState<string>('INR (₹)');
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
          provider: 'Gemma (via Ollama)',
          available: false,
          model: 'gemma3:4b',
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E7E5E4]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F291E]">Settings & System Health</h1>
          <p className="text-sm text-[#78716C]">
            Live diagnostic status for MongoDB Atlas, Gemma AI inference, and optional partner integrations
          </p>
        </div>

        <button
          onClick={checkConnectivity}
          className="btn-outline px-3 py-2 text-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Re-test Connections
        </button>
      </div>

      {/* Connectivity Diagnostic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MongoDB Connection Status */}
        <div className="card-warm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[#1B4332]" />
              <h2 className="text-base font-bold text-[#0F291E]">MongoDB Atlas Storage</h2>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                integrations?.database.connected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {integrations?.database.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl text-xs space-y-2 border border-stone-200">
            <div className="flex justify-between">
              <span className="text-[#78716C]">Storage Status:</span>
              <span className="font-semibold text-stone-800">
                {integrations?.database.connected
                  ? `Persistent (latency: ${integrations.database.latency_ms ?? '~'}ms)`
                  : 'Unsaved Session (No URI)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#78716C]">Database Name:</span>
              <span className="font-mono text-stone-800">{integrations?.database.database_name}</span>
            </div>
            <div className="pt-2 border-t border-stone-200 text-[#57534E]">
              {integrations?.database.message}
            </div>
          </div>

          {!integrations?.database.connected && (
            <div className="space-y-2 text-xs text-[#57534E]">
              <p className="font-semibold text-[#1C1917]">How to connect persistent database:</p>
              <ol className="list-decimal pl-4 space-y-1 text-[#78716C]">
                <li>
                  Create a free cluster at{' '}
                  <a
                    href="https://cloud.mongodb.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#1B4332] underline font-medium"
                  >
                    cloud.mongodb.com
                  </a>
                </li>
                <li>Add a database user and whitelist your IP (or 0.0.0.0/0 for testing)</li>
                <li>In <code>backend/.env</code>, configure:</li>
              </ol>
              <div className="bg-stone-900 text-stone-200 p-2.5 rounded-lg font-mono text-[11px] flex items-center justify-between">
                <span>MONGODB_URI=mongodb+srv://...</span>
                <button
                  onClick={() =>
                    handleCopy(
                      'MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority',
                      'mongo'
                    )
                  }
                  className="text-stone-400 hover:text-white"
                >
                  {copiedCmd === 'mongo' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Ollama / Gemma AI Status */}
        <div className="card-warm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D97706]" />
              <h2 className="text-base font-bold text-[#0F291E]">Gemma via Ollama AI</h2>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                integrations?.ai.available && integrations.ai.model_loaded
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : integrations?.ai.available
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-stone-100 text-stone-700 border-stone-300'
              }`}
            >
              {integrations?.ai.available
                ? integrations.ai.model_loaded
                  ? 'Model Ready'
                  : 'Server Online'
                : 'Offline'}
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl text-xs space-y-2 border border-stone-200">
            <div className="flex justify-between">
              <span className="text-[#78716C]">Inference URL:</span>
              <span className="font-mono text-stone-800">{integrations?.ai.base_url}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#78716C]">Configured Model:</span>
              <span className="font-mono font-semibold text-[#1B4332]">{integrations?.ai.model}</span>
            </div>
            <div className="pt-2 border-t border-stone-200 text-[#57534E]">
              {integrations?.ai.message}
            </div>
          </div>

          <div className="space-y-2 text-xs text-[#57534E]">
            <p className="font-semibold text-[#1C1917]">PowerShell commands to run Ollama locally:</p>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="bg-stone-900 text-stone-200 p-2 rounded-lg flex items-center justify-between">
                <span>ollama serve</span>
                <button onClick={() => handleCopy('ollama serve', 'serve')} className="text-stone-400 hover:text-white">
                  {copiedCmd === 'serve' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="bg-stone-900 text-stone-200 p-2 rounded-lg flex items-center justify-between">
                <span>ollama pull gemma3:4b</span>
                <button onClick={() => handleCopy('ollama pull gemma3:4b', 'pull')} className="text-stone-400 hover:text-white">
                  {copiedCmd === 'pull' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Market & Workflow Integrations */}
      <div className="card-warm p-5 space-y-4">
        <h2 className="text-base font-bold text-[#0F291E]">Real-Time Market &amp; Workflow Orchestration</h2>
        <p className="text-xs text-[#78716C]">
          Live supplier benchmarks, append-only time-series analytics, and distributed workflow execution.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* SerpAPI */}
          <div className="p-4 rounded-xl border border-[#E7E5E4] bg-white space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-[#0F291E] flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-emerald-600" /> SerpAPI
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    (integrations as any)?.serpapi?.configured
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {(integrations as any)?.serpapi?.configured ? 'Active' : 'Unconfigured'}
                </span>
              </div>
              <p className="text-[#57534E] text-[11px] leading-relaxed">
                Google Shopping &amp; Search supplier price discovery. Benchmarks wholesale rates with local caching.
              </p>
            </div>
            <div className="text-[10px] text-stone-400 pt-2 border-t border-stone-100">
              Env: <code>SERPAPI_API_KEY</code>
            </div>
          </div>

          {/* Tiger Data */}
          <div className="p-4 rounded-xl border border-[#E7E5E4] bg-white space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-[#0F291E] flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-amber-600" /> Tiger Data
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    (integrations as any)?.tiger_data?.connected
                      ? 'bg-emerald-100 text-emerald-800'
                      : (integrations as any)?.tiger_data?.configured
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {(integrations as any)?.tiger_data?.connected
                    ? 'Connected'
                    : (integrations as any)?.tiger_data?.configured
                    ? 'Configured'
                    : 'Unconfigured'}
                </span>
              </div>
              <p className="text-[#57534E] text-[11px] leading-relaxed">
                TimescaleDB / PostgreSQL append-only hypertable for historical market price snapshots and time-series analytics.
              </p>
            </div>
            <div className="text-[10px] text-stone-400 pt-2 border-t border-stone-100">
              Env: <code>TIGER_DATA_DATABASE_URL</code>
            </div>
          </div>

          {/* Temporal */}
          <div className="p-4 rounded-xl border border-[#E7E5E4] bg-white space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-[#0F291E] flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-cyan-600" /> Temporal
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    (integrations as any)?.temporal?.configured
                      ? 'bg-cyan-100 text-cyan-800'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {(integrations as any)?.temporal?.configured ? 'Enabled' : 'Direct Fallback'}
                </span>
              </div>
              <p className="text-[#57534E] text-[11px] leading-relaxed">
                Distributed orchestration engine for multi-step kitchen planning workflows with deterministic retry policies.
              </p>
            </div>
            <div className="text-[10px] text-stone-400 pt-2 border-t border-stone-100">
              Env: <code>TEMPORAL_ADDRESS</code>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Partner Integrations Section */}
      <div className="card-warm p-5 space-y-4">
        <h2 className="text-base font-bold text-[#0F291E]">Optional Partner Integrations</h2>
        <p className="text-xs text-[#78716C]">
          Modular services enabled only when their respective API keys are present in <code>backend/.env</code>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* ElevenLabs */}
          <div className="p-4 rounded-xl border border-[#E7E5E4] bg-white space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-[#0F291E] flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-[#D97706]" /> ElevenLabs
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    integrations?.elevenlabs.configured
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {integrations?.elevenlabs.configured ? 'Active' : 'Unconfigured'}
                </span>
              </div>
              <p className="text-[#57534E] text-[11px] leading-relaxed">
                Server-side Speech-to-Text for kitchen voice notes. Turn spoken orders into structured entries.
              </p>
            </div>
            <div className="text-[10px] text-stone-400 pt-2 border-t border-stone-100">
              Env: <code>ELEVENLABS_API_KEY</code>
            </div>
          </div>

          {/* Backboard */}
          <div className="p-4 rounded-xl border border-[#E7E5E4] bg-white space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-[#0F291E] flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#1B4332]" /> Backboard
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    integrations?.backboard.configured
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {integrations?.backboard.configured ? 'Active' : 'Optional'}
                </span>
              </div>
              <p className="text-[#57534E] text-[11px] leading-relaxed">
                Persistent assistant threads for multi-turn kitchen planning conversations.
              </p>
            </div>
            <div className="text-[10px] text-stone-400 pt-2 border-t border-stone-100">
              Env: <code>BACKBOARD_API_KEY</code>
            </div>
          </div>

          {/* Tinker by Thinking Machines */}
          <div className="p-4 rounded-xl border border-[#E7E5E4] bg-white space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-[#0F291E] flex items-center gap-1.5">
                  <BrainCircuit className="w-4 h-4 text-purple-700" /> Tinker
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    integrations?.tinker.configured
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {integrations?.tinker.configured ? 'Active' : 'Optional'}
                </span>
              </div>
              <p className="text-[#57534E] text-[11px] leading-relaxed">
                Domain fine-tuning dataset generation for open-weight kitchen models.
              </p>
            </div>
            <div className="text-[10px] text-stone-400 pt-2 border-t border-stone-100">
              Env: <code>TINKER_API_KEY</code>
            </div>
          </div>
        </div>
      </div>

      {/* Business Configuration & Defaults */}
      <div className="card-warm p-5 space-y-4">
        <h2 className="text-base font-bold text-[#0F291E]">Business & Preparation Defaults</h2>

        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-[#57534E] mb-1">
              Default Safety Buffer (% extra portions)
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={safetyBuffer}
              onChange={(e) => setSafetyBuffer(parseInt(e.target.value) || 0)}
              className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 bg-white outline-none font-medium text-sm"
            />
            <span className="text-[11px] text-[#A8A29E] mt-1 block">Applied to baseline prep plans</span>
          </div>

          <div>
            <label className="block font-semibold text-[#57534E] mb-1">Display Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 bg-white outline-none"
            >
              <option value="INR (₹)">Indian Rupee (₹)</option>
              <option value="USD ($)">US Dollar ($)</option>
            </select>
            <span className="text-[11px] text-[#A8A29E] mt-1 block">Pricing & report unit</span>
          </div>

          <div className="flex items-end">
            <button type="submit" className="btn-forest px-5 py-2 font-semibold text-xs shadow-xs">
              Save Preferences
            </button>
            {settingsSaved && (
              <span className="ml-3 text-emerald-700 text-xs font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saved!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Security & Secret Handling Disclosure */}
      <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-sm">Data Integrity & Privacy Notice</p>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            DabbaIQ stores all sensitive credentials exclusively in server-side environment variables. Private keys are never committed to version control, never exposed to client-side code, and never printed in logs. Open-weight Gemma inference executes locally via Ollama, ensuring proprietary recipes, ingredient prices, and customer orders remain on your private infrastructure.
          </p>
        </div>
      </div>
    </div>
  );
}
