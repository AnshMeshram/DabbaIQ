'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Receipt,
  Boxes,
  BookOpen,
  Trash2,
  BarChart3,
  Settings,
  MapPin,
  Clock,
  Plus,
  Menu,
  X,
  User,
  Layers,
  FileText,
  Activity,
  Database,
  Cpu,
  GitBranch,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { api, HealthStatus, AIStatus } from '@/lib/api';

// Core operations navigation
const primaryNavItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/experience', label: 'Inside the Dabba', icon: Layers, badge: '3D STUDIO', badgeColor: 'bg-tertiary-fixed text-on-tertiary-fixed' },
  { href: '/planner', label: 'AI Planner', icon: Sparkles, badge: 'GEMMA 2', badgeColor: 'bg-fresh-container text-on-fresh-container' },
  { href: '/sales', label: 'Sales Log', icon: Receipt },
  { href: '/inventory', label: 'Inventory & Stock', icon: Boxes },
  { href: '/recipes', label: 'Recipe Library', icon: BookOpen },
  { href: '/waste', label: 'Waste Tracker', icon: Trash2 },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
];

// Utility and admin items
const utilityNavItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/project-info', label: 'Project Info', icon: FileText, badge: 'v2.4', badgeColor: 'bg-surface-container-high text-on-surface-variant' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stationOpen, setStationOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  const stationRef = useRef<HTMLDivElement>(null);
  const healthRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (stationRef.current && !stationRef.current.contains(event.target as Node)) {
        setStationOpen(false);
      }
      if (healthRef.current && !healthRef.current.contains(event.target as Node)) {
        setHealthOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
    setStationOpen(false);
    setHealthOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  const checkStatus = useCallback(async () => {
    try {
      const h = await api.getHealth();
      setHealth(h);
    } catch {
      setHealth(null);
    }
    try {
      const a = await api.getAiStatus();
      setAiStatus(a);
    } catch {
      setAiStatus(null);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 25000); // 25s heartbeat
    return () => clearInterval(interval);
  }, [checkStatus]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) +
          ' • ' +
          now.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }) +
          ' IST'
      );
    };
    updateTime();
    const tInterval = setInterval(updateTime, 60000);
    return () => clearInterval(tInterval);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/60 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      {/* ─── DECK 1: Command & Operations Telemetry Bar ─── */}
      <div className="w-full border-b border-outline-variant/30">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-3">
            {/* Left: Brand Identity + Station Badge */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <Link href="/" className="flex items-center gap-2.5 group">
                {/* Brass 3-Tier Dabba Logo Mark */}
                <div className="w-9 h-9 rounded-lg bg-primary-container flex flex-col items-center justify-center p-1 shadow-[0_2px_0_0_#00210a] group-hover:bg-primary transition-all">
                  <div className="w-4.5 h-1.5 bg-sunshine rounded-xs mb-0.5" />
                  <div className="w-4.5 h-1.5 bg-white rounded-xs mb-0.5" />
                  <div className="w-4.5 h-1.5 bg-white rounded-xs" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-headline font-bold text-lg tracking-tight text-primary leading-none">
                    DabbaIQ
                  </span>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-xs bg-tertiary-fixed text-on-tertiary-fixed font-bold tracking-wider">
                    OPS DESK
                  </span>
                  <span className="hidden sm:inline font-mono text-[9px] px-1 py-0.5 rounded-xs bg-surface-container-high text-on-surface-variant font-medium">
                    v2.4
                  </span>
                </div>
              </Link>

              {/* Station Telemetry Pill with Flyout */}
              <div className="relative hidden md:block" ref={stationRef}>
                <button
                  type="button"
                  onClick={() => setStationOpen(!stationOpen)}
                  className="flex items-center gap-2 py-1 px-2.5 bg-surface-container-low hover:bg-surface-container rounded-lg border border-outline-variant/50 text-left transition-colors cursor-pointer group"
                >
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="font-mono text-xs font-bold text-on-surface">MUM-04</span>
                  <span className="text-outline-variant text-xs">//</span>
                  <span className="font-mono text-xs text-on-surface-variant hidden xl:inline">Central</span>
                  <span className="flex items-center gap-1.5 font-mono text-[11px] text-primary font-semibold pl-1 border-l border-outline-variant/60">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="hidden sm:inline">Lunch Dispatch Active</span>
                  </span>
                  <ChevronDown className="w-3 h-3 text-on-surface-variant group-hover:text-primary transition-transform ml-0.5" />
                </button>

                {/* Station Popover */}
                {stationOpen && (
                  <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl border border-outline-variant shadow-2xl ring-1 ring-black/5 p-4 z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-outline-variant/40">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-primary">
                        <MapPin className="w-4 h-4 text-primary" /> MUM-04 Central Rail Station
                      </div>
                      <span className="font-mono text-[10px] bg-primary-container text-white px-1.5 py-0.5 rounded">
                        DISPATCH HUB
                      </span>
                    </div>
                    <div className="space-y-2.5 py-3 font-mono text-xs text-on-surface-variant">
                      <div className="flex items-center justify-between">
                        <span>Active Meal Shift:</span>
                        <span className="font-bold text-primary">Lunch (11:00 - 14:30)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Kitchen Capacity:</span>
                        <span className="font-semibold text-on-surface">400 Dabbas / Day</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Thermal Steam Core:</span>
                        <span className="font-semibold text-secondary">62°C Iso-Stable</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>FSSAI License:</span>
                        <span className="font-semibold text-on-surface">#2152600100042</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-outline-variant/30 text-[11px]">
                        <span>Clock Sync:</span>
                        <span className="text-on-surface">{currentTime || 'IST'}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-outline-variant/40 flex items-center justify-between">
                      <Link
                        href="/settings"
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        Station Hardware Config <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Live Telemetry, Quick Action & Chef Profile */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Infrastructure Telemetry Pill */}
              <div className="relative hidden xl:block" ref={healthRef}>
                <button
                  type="button"
                  onClick={() => setHealthOpen(!healthOpen)}
                  className="flex items-center gap-2.5 font-mono text-[11px] px-2.5 py-1.5 bg-surface-container-low hover:bg-surface-container rounded-lg border border-outline-variant/50 transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-1 font-semibold text-primary">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        health?.db_connected ? 'bg-primary' : 'bg-amber-500 animate-ping'
                      }`}
                    />
                    MDB
                  </span>
                  <span className="text-outline-variant">•</span>
                  <span className="flex items-center gap-1 font-semibold text-primary">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        aiStatus?.available ? 'bg-primary' : 'bg-stone-400'
                      }`}
                    />
                    GEMMA
                  </span>
                  <span className="text-outline-variant">•</span>
                  <span className="flex items-center gap-1 font-semibold text-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    TMPRL
                  </span>
                  <ChevronDown className="w-3 h-3 text-on-surface-variant group-hover:text-primary transition-transform" />
                </button>

                {/* Health Flyout Popover */}
                {healthOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-outline-variant shadow-2xl ring-1 ring-black/5 p-4 z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-outline-variant/40 font-mono text-xs font-bold text-on-surface">
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-primary" /> System Telemetry
                      </div>
                      <span className="text-[10px] text-primary bg-primary-fixed/40 px-1.5 py-0.5 rounded font-semibold">
                        HEALTHY
                      </span>
                    </div>
                    <div className="space-y-3 py-3 text-xs font-mono">
                      <div className="flex items-start gap-2.5">
                        <Database className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-on-surface truncate">MongoDB Atlas</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 font-medium ${
                                health?.db_connected
                                  ? 'bg-primary-fixed text-on-primary-fixed'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {health?.db_connected ? 'Connected' : 'Degraded'}
                            </span>
                          </div>
                          <div
                            className="text-[11px] text-on-surface-variant truncate mt-0.5"
                            title={health?.db_message || 'Active Atlas Replica Set'}
                          >
                            {health?.db_message || 'Active Atlas Replica Set'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Cpu className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-on-surface truncate">Gemma 2 AI</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 font-medium ${
                                aiStatus?.available
                                  ? 'bg-primary-fixed text-on-primary-fixed'
                                  : 'bg-stone-200 text-stone-700'
                              }`}
                            >
                              {aiStatus?.available ? 'Ready' : 'Offline'}
                            </span>
                          </div>
                          <div
                            className="text-[11px] text-on-surface-variant truncate mt-0.5"
                            title={aiStatus?.message || 'Ollama Gemma 2:9b reasoning engine'}
                          >
                            {aiStatus?.message || 'Ollama Gemma 2:9b reasoning engine'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <GitBranch className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-on-surface truncate">Temporal Engine</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed shrink-0 font-medium">
                              Synchronized
                            </span>
                          </div>
                          <div className="text-[11px] text-on-surface-variant truncate mt-0.5">
                            Resilient Kitchen Workflow Orchestrator
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-outline-variant/40 flex items-center justify-between">
                      <Link
                        href="/settings"
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        Full Diagnostics &amp; Logs <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Record Sale CTA */}
              <Link
                href="/sales"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-secondary text-white font-body text-xs font-semibold hover:bg-[#802a00] active:translate-y-0.5 transition-all shadow-[0_2px_0_0_#571a00] shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Sale</span>
              </Link>

              {/* Chef Profile Chip */}
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 pl-2 border-l border-outline-variant/60 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="hidden sm:block text-left font-mono">
                    <div className="text-xs font-bold leading-tight text-on-surface">GP</div>
                    <div className="text-[10px] text-on-surface-variant uppercase leading-none">
                      Head Chef
                    </div>
                  </div>
                </button>

                {/* Profile Flyout */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-outline-variant shadow-2xl ring-1 ring-black/5 p-3 z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-outline-variant/40">
                      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold font-mono">
                        GP
                      </div>
                      <div>
                        <div className="text-xs font-bold text-on-surface">Girish Patil</div>
                        <div className="text-[10px] font-mono text-on-surface-variant">
                          Executive Kitchen Director
                        </div>
                      </div>
                    </div>
                    <div className="py-2 space-y-1 text-xs">
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-primary" /> System Settings
                      </Link>
                      <Link
                        href="/project-info"
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-primary" /> Technical Architecture
                      </Link>
                      <Link
                        href="/privacy"
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Privacy &amp; DPDP Notice
                      </Link>
                    </div>
                    <div className="pt-2 border-t border-outline-variant/40 text-[10px] font-mono text-on-surface-variant flex items-center justify-between px-1">
                      <span>Station: MUM-04</span>
                      <span className="text-primary font-semibold">Active Shift</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Drawer Hamburger */}
              <div className="flex lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                  aria-label="Toggle navigation"
                >
                  {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── DECK 2: Primary Operations Workflow Rail (Desktop Only) ─── */}
      <div className="hidden lg:block bg-surface-container-lowest/80">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-11 gap-4">
            {/* Core Operations Workflows */}
            <nav className="flex items-center gap-1">
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 relative group ${
                      isActive
                        ? 'bg-primary-container text-white shadow-xs font-bold'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 transition-colors ${
                        isActive ? 'text-white' : 'text-on-surface-variant group-hover:text-primary'
                      }`}
                    />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold uppercase tracking-wider ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badgeColor
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-sunshine rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* System & Support Utilities */}
            <div className="flex items-center gap-1 pl-3 border-l border-outline-variant/50 shrink-0">
              {utilityNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? 'bg-primary-container text-white shadow-xs font-bold'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isActive ? 'text-white' : 'text-on-surface-variant'
                      }`}
                    />
                    <span>{item.label}</span>
                    {item.badge && !isActive && (
                      <span
                        className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── MOBILE DRAWER (Collapsible on < 1024px) ─── */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-outline-variant bg-surface-container-lowest px-4 pt-3 pb-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl animate-in fade-in slide-in-from-top-3 duration-200">
          {/* Station & Shift Summary Card */}
          <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/50 space-y-2">
            <div className="flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-1.5 text-primary font-bold">
                <MapPin className="w-3.5 h-3.5" /> MUM-04 Central Rail Kitchen
              </div>
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            </div>
            <div className="flex items-center justify-between font-mono text-[11px] text-on-surface-variant pt-1 border-t border-outline-variant/30">
              <span>Shift: Lunch Dispatch</span>
              <span>{currentTime || 'IST'}</span>
            </div>
            <div className="flex items-center gap-3 pt-1 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-primary">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    health?.db_connected ? 'bg-primary' : 'bg-amber-500'
                  }`}
                />
                Atlas {health?.db_connected ? 'Online' : 'Degraded'}
              </span>
              <span className="text-outline-variant">•</span>
              <span className="flex items-center gap-1 text-primary">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    aiStatus?.available ? 'bg-primary' : 'bg-stone-400'
                  }`}
                />
                Gemma 2 {aiStatus?.available ? 'Ready' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Quick Record Sale Button for Mobile */}
          <Link
            href="/sales"
            onClick={() => setMobileOpen(false)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary text-white font-semibold text-xs shadow-sm hover:bg-[#802a00] active:translate-y-0.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Sale / Dispatch</span>
          </Link>

          {/* Core Operations Section */}
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant px-1 font-bold">
              Kitchen Operations
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex flex-col gap-1 p-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-primary-container text-white shadow-xs'
                        : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-primary'}`} />
                      {item.badge && (
                        <span
                          className={`text-[8px] font-mono px-1 py-0.2 rounded font-bold ${
                            isActive ? 'bg-white/20 text-white' : item.badgeColor
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="leading-tight mt-1">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* System & Support Utilities Section */}
          <div className="space-y-1 pt-2 border-t border-outline-variant/40">
            <div className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant px-1 font-bold">
              System &amp; Documentation
            </div>
            <div className="space-y-1 pt-1">
              {utilityNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-primary-container text-white'
                        : 'text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-primary'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
              <Link
                href="/privacy"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
              >
                <ShieldCheck className="w-4 h-4 text-outline" />
                <span>Privacy &amp; DPDP Policy</span>
              </Link>
              <Link
                href="/terms"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
              >
                <ExternalLink className="w-4 h-4 text-outline" />
                <span>Terms of Service</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
