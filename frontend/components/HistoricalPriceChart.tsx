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
      <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-4 text-xs font-mono text-on-surface-variant">
        <div className="flex items-center gap-2 text-primary font-bold mb-1">
          <Database className="w-4 h-4 text-secondary" />
          <span>TimescaleDB (Tiger Data) Procurement Trend Inactive</span>
        </div>
        <p className="font-body text-xs text-on-surface-variant">
          Configure <code className="bg-white border border-outline-variant px-1 py-0.5 rounded text-primary font-mono font-bold">TIGER_DATA_DATABASE_URL</code> in{' '}
          <code className="text-primary font-bold">backend/.env</code> to persist append-only market price snapshots in TimescaleDB.
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
    <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h4 className="font-mono text-xs font-bold text-primary uppercase tracking-wider">
            {ingredientName} • Market Price Trend (Tiger Data)
          </h4>
        </div>
        <span className="font-mono text-[10px] text-on-surface-variant">Trailing 60 Days</span>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center font-mono text-xs text-on-surface-variant">
          Loading price history from TimescaleDB...
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-32 flex flex-col items-center justify-center font-body text-xs text-on-surface-variant border border-dashed border-outline-variant rounded-lg p-4">
          <p className="font-semibold text-on-surface">No recorded price snapshots for &quot;{ingredientName}&quot; yet.</p>
          <p className="font-mono text-[11px] text-on-surface-variant mt-0.5">
            Use &quot;Prices&quot; action in the table above to search wholesale suppliers and capture price snapshots.
          </p>
        </div>
      ) : (
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e2da" />
              <XAxis dataKey="date" stroke="#71796f" fontSize={10} tickLine={false} fontFamily="var(--font-mono)" />
              <YAxis stroke="#71796f" fontSize={10} tickLine={false} fontFamily="var(--font-mono)" />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-white border border-outline-variant p-2 rounded-lg text-xs font-mono shadow-md">
                        <p className="font-bold text-primary">₹{item.price}</p>
                        <p className="text-on-surface-variant text-[10px]">Source: {item.source}</p>
                        <p className="text-on-surface-variant text-[10px]">{item.date}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#18542a"
                strokeWidth={2}
                dot={{ fill: '#ff641a', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
