'use client';

import React, { useEffect, useState } from 'react';
import { api, PriceHistoryItem } from '@/lib/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Database, AlertCircle } from 'lucide-react';

interface Props {
  ingredientName: string;
}

export default function HistoricalPriceChart({ ingredientName }: Props) {
  const [history, setHistory] = useState<PriceHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!ingredientName) return;

    let isMounted = true;
    setLoading(true);

    api
      .getPriceHistory(ingredientName, 60)
      .then((res) => {
        if (!isMounted) return;
        setConfigured(res.configured);
        setMessage(res.message || null);
        setHistory(res.history || []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setMessage(err.message || 'Error loading price history');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [ingredientName]);

  if (!configured) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
          <Database className="w-4 h-4 text-amber-400" />
          <span>Tiger Data Price History Inactive</span>
        </div>
        <p className="text-slate-500">
          Set <code className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">TIGER_DATA_DATABASE_URL</code> in{' '}
          <code className="text-slate-300">backend/.env</code> to persist append-only market price snapshots in TimescaleDB.
        </p>
      </div>
    );
  }

  const chartData = history
    .filter((h) => h.price_numeric !== null && h.price_numeric !== undefined)
    .map((h) => ({
      date: new Date(h.captured_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      price: h.price_numeric,
      source: h.source_name,
      currency: h.currency || 'INR',
    }));

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
            {ingredientName} • Market Price Trend (Tiger Data)
          </h4>
        </div>
        <span className="text-[10px] text-slate-500">Last 60 Days</span>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center text-xs text-slate-500">
          Loading price history...
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-32 flex flex-col items-center justify-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
          <p>No recorded price snapshots for &quot;{ingredientName}&quot; yet.</p>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Use &quot;Find Suppliers &amp; Prices&quot; above to capture market snapshots.
          </p>
        </div>
      ) : (
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-950 border border-slate-700 p-2 rounded text-xs shadow-xl">
                        <p className="font-bold text-white">₹{data.price}</p>
                        <p className="text-slate-400 text-[10px]">Source: {data.source}</p>
                        <p className="text-slate-500 text-[10px]">{data.date}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
