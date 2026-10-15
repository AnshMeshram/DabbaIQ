import { AlertTriangle, Database, Info } from 'lucide-react';
import Link from 'next/link';

interface DemoBannerProps {
  hasDemoData?: boolean;
  dbDisconnected?: boolean;
}

export default function DemoBanner({ hasDemoData = true, dbDisconnected = false }: DemoBannerProps) {
  if (!dbDisconnected && !hasDemoData) return null;

  return (
    <div className="bg-[#FFFBEB] border-b border-[#FDE68A] text-[#92400E] px-4 py-2.5 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {dbDisconnected ? (
            <Database className="w-4 h-4 text-[#D97706] shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-[#D97706] shrink-0" />
          )}
          <span>
            {dbDisconnected ? (
              <>
                <strong>Notice:</strong> Database credentials not configured. Changes will <em>not</em> be permanently saved.
              </>
            ) : (
              <>
                <strong>Demo Mode:</strong> Displaying illustrative sample data for Hacktoberfest 2026. Demo records are clearly badged.
              </>
            )}
          </span>
        </div>
        <Link
          href="/settings"
          className="underline font-semibold hover:text-[#78350F] whitespace-nowrap text-xs"
        >
          Check Settings & Connectivity &rarr;
        </Link>
      </div>
    </div>
  );
}
