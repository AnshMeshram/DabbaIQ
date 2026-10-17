'use client';

import React, { useState } from 'react';
import { api, WorkflowTriggerResponse } from '@/lib/api';
import { Play, CheckCircle2, Clock, Terminal, AlertTriangle, RefreshCw, Cpu } from 'lucide-react';

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
    <div className="desk-card p-5 border-l-4 border-l-primary bg-surface-container-low/70">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            <h3 className="font-headline font-bold text-sm text-primary tracking-wide">
              Temporal Distributed Workflow Orchestrator
            </h3>
            <span className="font-mono text-[10px] bg-primary-container text-white px-1.5 py-0.5 rounded font-bold">
              PIPELINE
            </span>
          </div>
          <p className="font-body text-xs text-on-surface-variant mt-0.5">
            Orchestrates context retrieval, deterministic baseline forecasting, SerpAPI supplier pricing, Tiger Data snapshots, and Gemma recommendations in a resilient workflow.
          </p>
        </div>

        <button
          onClick={handleStartWorkflow}
          disabled={loading}
          className="btn-primary text-xs px-4 py-2 shrink-0 shadow-[0_2px_0_0_#00210a]"
        >
          {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          <span>{loading ? 'Starting Workflow...' : 'Run Planning Pipeline'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-error-container border border-error/30 rounded-lg text-xs font-mono text-error flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {workflowInfo && (
        <div className="mt-3 p-4 bg-white rounded-xl border border-outline-variant/60 text-xs font-mono">
          <div className="flex items-center justify-between mb-2">
            <span className="text-on-surface-variant">
              Workflow ID:{' '}
              <code className="text-primary bg-surface-container px-1.5 py-0.5 rounded font-bold">
                {workflowInfo.workflow_id}
              </code>
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                workflowInfo.temporal_active
                  ? 'bg-primary-fixed text-on-primary-fixed border border-primary/30'
                  : 'bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary-fixed/60'
              }`}
            >
              {pollStatus || (workflowInfo.temporal_active ? 'Running' : 'Direct Fallback')}
            </span>
          </div>

          <p className="text-on-surface-variant text-[11px] mb-3">{workflowInfo.message}</p>

          {!workflowInfo.temporal_active && (
            <div className="p-3 bg-surface-container rounded-lg border border-outline-variant/40 text-[11px] text-on-surface-variant">
              <div className="flex items-center gap-1.5 font-bold text-on-surface mb-1">
                <Terminal className="w-3.5 h-3.5 text-primary" />
                <span>To run Temporal server locally:</span>
              </div>
              <pre className="bg-white p-2 rounded text-primary font-mono text-[10px] overflow-x-auto border border-outline-variant/30">
                temporal server start-dev
              </pre>
              <p className="mt-1 text-[10px] text-on-surface-variant">
                Worker command:{' '}
                <code className="text-primary font-bold">python -m app.temporal.worker</code>
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
              <div key={idx} className="p-2 bg-surface-container-low rounded-lg border border-outline-variant/50 text-[10px]">
                <span className="font-bold text-primary block">{s.step}</span>
                <span className="text-on-surface-variant">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
