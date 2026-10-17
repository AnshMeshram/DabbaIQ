'use client';

import React from 'react';
import Link from 'next/link';
import {
  Flame,
  Printer,
  PlusCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ShiftTelemetryBarProps {
  targetDabbas?: number;
  onQuickReconcile?: () => void;
  onOpenWalkInModal?: () => void;
}

export default function ShiftTelemetryBar({
  targetDabbas = 185,
  onQuickReconcile,
  onOpenWalkInModal,
}: ShiftTelemetryBarProps) {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <section className="w-full bg-surface-container-high/80 backdrop-blur-sm border border-outline-variant/60 rounded-xl p-3.5 sm:p-4 mb-6 shadow-[0_2px_0_0_#e6e2da]">
      <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-4">
        {/* Active Shift Identifier */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded-lg shadow-[0_2px_0_0_#00210a]">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed animate-ping" />
            <span className="font-mono text-xs text-white uppercase font-bold tracking-wider">
              LIVE DESK
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-headline font-bold text-base sm:text-lg text-primary leading-tight">
                Today&apos;s Shift: Lunch Service
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded-xs bg-surface-container text-on-surface font-semibold border border-outline-variant/40">
                11:30 – 14:30 IST
              </span>
            </div>
            <p className="font-body text-xs text-on-surface-variant flex flex-wrap items-center gap-2 mt-0.5">
              <span className="font-bold text-on-surface">{targetDabbas} Target Dabbas</span>
              <span className="text-outline-variant">•</span>
              <span>Station Group: MUM-04 Central Rail</span>
              <span className="text-outline-variant">•</span>
              <span className="text-primary font-semibold">Tiffin Master: Ganesh Parab</span>
            </p>
          </div>
        </div>

        {/* Quick Action Commands */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={onQuickReconcile || (() => {})}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-outline-variant/60 text-on-surface font-body text-xs font-semibold hover:bg-surface-container active:scale-98 transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Reconcile Batch</span>
          </button>

          <button
            onClick={handlePrint}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-outline-variant/60 text-on-surface font-body text-xs font-semibold hover:bg-surface-container active:scale-98 transition-all shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-on-surface-variant" />
            <span>Print Station Slips</span>
          </button>

          {onOpenWalkInModal ? (
            <button
              onClick={onOpenWalkInModal}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-secondary text-white font-body text-xs font-semibold hover:bg-[#802a00] active:scale-98 transition-all shadow-[0_2px_0_0_#571a00]"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Log Walk-in Sale</span>
            </button>
          ) : (
            <Link
              href="/sales"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-secondary text-white font-body text-xs font-semibold hover:bg-[#802a00] active:scale-98 transition-all shadow-[0_2px_0_0_#571a00]"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Log Walk-in Sale</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
