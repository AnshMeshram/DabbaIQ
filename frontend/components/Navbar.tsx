'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Receipt,
  Boxes,
  BookOpen,
  Trash2,
  BarChart3,
  Settings,
  CircleDot,
  Menu,
  X,
} from 'lucide-react';
import { api, HealthStatus, AIStatus } from '@/lib/api';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/planner', label: 'AI Planner', icon: Sparkles, highlight: true },
  { href: '/sales', label: 'Sales', icon: Receipt },
  { href: '/inventory', label: 'Inventory', icon: Boxes },
  { href: '/recipes', label: 'Recipes', icon: BookOpen },
  { href: '/waste', label: 'Waste Tracker', icon: Trash2 },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);

  useEffect(() => {
    // Check backend health and AI status
    api.getHealth().then(setHealth).catch(() => setHealth(null));
    api.getAiStatus().then(setAiStatus).catch(() => setAiStatus(null));
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#E7E5E4] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-[#1B4332] text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-[#2D6A4F] transition-colors">
                🍱
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-[#0F291E] tracking-tight">DabbaIQ</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#EBF8EE] text-[#1B4332] px-2 py-0.5 rounded-full border border-[#D8F3DC]">
                    MVP
                  </span>
                </div>
                <p className="text-[11px] text-[#78716C] leading-none hidden sm:block">Cook right. Waste less.</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#1B4332] text-white shadow-xs'
                      : item.highlight
                      ? 'text-[#D97706] hover:bg-[#FEF3C7]/60'
                      : 'text-[#44403C] hover:bg-[#F5F5F4] hover:text-[#1C1917]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-[#D97706]' : 'text-[#78716C]'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Status Badges */}
          <div className="hidden lg:flex items-center gap-2">
            {/* DB Status */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                health?.db_connected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
              title={health?.db_message || 'Checking database...'}
            >
              <CircleDot className={`w-3 h-3 ${health?.db_connected ? 'text-emerald-600' : 'text-amber-500'}`} />
              <span>{health?.db_connected ? 'DB Connected' : 'DB Offline'}</span>
            </div>

            {/* AI Status */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                aiStatus?.available && aiStatus?.model_loaded
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : aiStatus?.available
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-stone-100 text-stone-600 border-stone-200'
              }`}
              title={aiStatus?.message || 'Checking AI status...'}
            >
              <Sparkles className={`w-3 h-3 ${aiStatus?.available ? 'text-emerald-600' : 'text-stone-400'}`} />
              <span>{aiStatus?.available ? (aiStatus.model_loaded ? 'Gemma Ready' : 'Model Missing') : 'AI Offline'}</span>
            </div>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-[#57534E] hover:bg-[#F5F5F4]"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E7E5E4] bg-[#FFFFFF] px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-[#1B4332] text-white' : 'text-[#44403C] hover:bg-[#F5F5F4]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#78716C]'}`} />
                {item.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-[#E7E5E4] flex flex-col gap-2">
            <div className="text-xs text-[#78716C] flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${health?.db_connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              MongoDB: {health?.db_connected ? 'Connected' : 'Offline (In-memory/Unsaved)'}
            </div>
            <div className="text-xs text-[#78716C] flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${aiStatus?.available ? 'bg-emerald-500' : 'bg-stone-400'}`} />
              Ollama / Gemma: {aiStatus?.available ? 'Available' : 'Offline'}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
