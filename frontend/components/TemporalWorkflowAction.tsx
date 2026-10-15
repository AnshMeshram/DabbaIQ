'use client';

import React, { useState } from 'react';
import { api, WorkflowTriggerResponse } from '@/lib/api';
import { useUIStore } from '@/lib/store';
import { Play, CheckCircle2, Clock, Terminal, AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react';

interface Props {
  targetDate: string;
  mealPeriod: string;
  onPlanCreated?: (planId: string) => void;
}

export default function TemporalWorkflowAction({ targetDate, mealPeriod, onPlanCreated }: Props) {
  const [loading, setLoading] = useState(false);
  const [workflowInfo, setWorkflowInfo] = useState<WorkflowTriggerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollStatus, setPollStatus] = useState<string | null>(null);

  const handleStartWorkflow = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.triggerWorkflowPlan(targetDate, mealPeriod);
      setWorkflowInfo(res);

      if (res.temporal_active && res.workflow_id) {
        // Poll status
        pollWorkflow(res.workflow_id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start Temporal workflow');
    } finally {
      setLoading(false);
    }
  };

  const pollWorkflow = async (workflowId: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const stat = await api.getWorkflowStatus(workflowId);
        setPollStatus(stat.status);
        if (stat.status === 'COMPLETED') {
          clearInterval(interval);
          if (stat.result?.plan_id && onPlanCreated) {
            onPlanCreated(stat.result.plan_id);
          }
        } else if (stat.status === 'FAILED' || stat.status === 'ERROR' || attempts > 20) {
          clearInterval(interval);
        }
      } catch {
        clearInterval(interval);
      }
    }, 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">
              Temporal Distributed Workflow Orchestration
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Orchestrates context retrieval, baseline forecasting, SerpAPI pricing, Tiger Data snapshots, and Gemma recommendations.
          </p>
        </div>

        <button
          onClick={handleStartWorkflow}
          disabled={loading}
          className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition shadow-lg shadow-cyan-950/40"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {loading ? 'Starting Workflow...' : 'Start Planning Workflow'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {workflowInfo && (
        <div className="mt-3 p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400">
              Workflow ID:{' '}
              <code className="text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded font-mono">
                {workflowInfo.workflow_id}
              </code>
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                workflowInfo.temporal_active
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {pollStatus || (workflowInfo.temporal_active ? 'Running' : 'Direct Fallback')}
            </span>
          </div>

          <p className="text-slate-400 text-[11px] mb-3">{workflowInfo.message}</p>

          {!workflowInfo.temporal_active && (
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>To run Temporal locally on Windows:</span>
              </div>
              <pre className="bg-slate-950 p-2 rounded text-cyan-300 font-mono text-[10px] overflow-x-auto">
                temporal server start-dev
              </pre>
              <p className="mt-1 text-[10px] text-slate-500">
                Then start the DabbaIQ worker:{' '}
                <code className="text-slate-400">python -m app.temporal.worker</code>
              </p>
            </div>
          )}

          {/* Workflow Step Pipeline */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { step: '1. MongoDB Context', desc: 'Read sales & inventory' },
              { step: '2. Demand Forecast', desc: 'Deterministic baseline' },
              { step: '3. SerpAPI Search', desc: 'Live market prices' },
              { step: '4. Tiger Data', desc: 'Time-series snapshot' },
              { step: '5. Gemma Grounding', desc: 'Validated menu advice' },
              { step: '6. Draft Persisted', desc: 'Idempotent save' },
            ].map((s, idx) => (
              <div key={idx} className="p-2 bg-slate-900/50 rounded-lg border border-slate-800/80 text-[10px]">
                <span className="font-semibold text-slate-300 block">{s.step}</span>
                <span className="text-slate-500">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
