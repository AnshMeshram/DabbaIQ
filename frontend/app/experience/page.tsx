'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Layers,
  Sparkles,
  Boxes,
  BookOpen,
  Trash2,
  Receipt,
  BarChart3,
  Settings,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Flame,
  Scale,
  TrendingDown,
  TrendingUp,
  Sliders,
  Maximize2,
  ChefHat,
  Database,
  Cpu,
  RefreshCw,
  Camera,
  Layers as LayersIcon,
  Eye,
  SlidersHorizontal,
  Compass,
  FileCode2,
  X,
  ChevronDown,
} from 'lucide-react';

const STORYBOARD_STATES = [
  {
    id: 1,
    stepName: 'LATENT CLAMP',
    stepDesc: 'Brass latch released',
    title: 'State 1: Closed Stack',
    subtitle: 'Hermetically Sealed for Dispatch',
    desc: 'Four cylindrical SS304 food-grade stainless steel tiers clamped securely by twin side latches. Overhead forest green enameled handle balanced for dabbe-wallah rail transit across Mumbai central circuits.',
    tareWeight: '780 g',
    thermalState: 'Sealed @ 78°C',
    carrierTag: '#MB-404-LOCKED',
    image: '/stitch/state-01-closed.png',
    targetRoute: '/',
    targetLabel: 'View Operational Dashboard',
  },
  {
    id: 2,
    stepName: 'LID ELEVATION',
    stepDesc: 'Top seal unlocked',
    title: 'State 2: Lid Lifting',
    subtitle: 'Pressure Release & Steam Seal',
    desc: 'The brass locking latches are unclasped and the top lid hovers upward. A gentle wisp of steam escapes, releasing the aroma of fresh phulkas and hot dal tadka while preserving temperature lock.',
    tareWeight: '160 g (Lid)',
    thermalState: 'Venting @ 74°C',
    carrierTag: '#MB-404-UNLATCHED',
    image: '/stitch/state-02-lid-lifting.png',
    targetRoute: '/planner',
    targetLabel: 'Open AI Prep Planner',
  },
  {
    id: 3,
    stepName: 'BREAD BOUNDARY',
    stepDesc: 'Tier 04 phulkas exposed',
    title: 'State 3: Tier 4 Separating',
    subtitle: 'Roti Sub-Assembly Revealed',
    desc: 'Tier 04 separates cleanly from the gasket core. Three whole-wheat phulkas, folded double, insulated from moisture below. Moisture transfer: 0.0%. Mechanical air gap maintains puff elasticity for 4.5 hours.',
    tareWeight: '120 g (4 Phulkas)',
    thermalState: 'Holding @ 68°C',
    carrierTag: '#MB-404-TIER-04',
    image: '/stitch/state-03-separating.png',
    targetRoute: '/planner',
    targetLabel: 'Configure Daily Baking Ledger',
  },
  {
    id: 4,
    stepName: 'DAL / STEAM CORE',
    stepDesc: 'Tier 03 thermal lock',
    title: 'State 4: Disassembled Floating',
    subtitle: 'Exploded Mechanical Mid-Air Suspension',
    desc: 'All 4 containers and lid float in mid-air with generous vertical clearance. From peak to base: Lid, Phulkas, Toor Dal Tadka, Basmati Jeera Rice, and Seasoned Aloo Gobi. Every ingredient is mapped to raw commodity costs.',
    tareWeight: '1,420 g (Full Meal)',
    thermalState: 'Calibrated Nutrition',
    carrierTag: '#MB-404-EXPLODED',
    image: '/stitch/state-04-exploded.png',
    targetRoute: '/inventory',
    targetLabel: 'Inspect Raw Commodity Stock',
  },
  {
    id: 5,
    stepName: 'SUBZI & SPICE TIER',
    stepDesc: 'Tier 02 aroma ring',
    title: 'State 5: Feature Architecture',
    subtitle: 'Physical Hardware Mapped to Software Modules',
    desc: 'Every physical tier maps directly to an algorithmic software module: Tier 1 to AI Planner, Tier 2 to Inventory, Tier 3 to Recipe Costing Matrix, and Tier 4 to Waste Audit.',
    tareWeight: '620 ml Net Vol',
    thermalState: '100% Traceable',
    carrierTag: '#MB-404-ARCH',
    image: '/stitch/state-dishes-bowl.png',
    targetRoute: '/recipes',
    targetLabel: 'Open Recipe Costing Matrix',
  },
  {
    id: 6,
    stepName: 'RICE BASE BED',
    stepDesc: 'Tier 01 foundation seat',
    title: 'State 6: Complete Kitchen System',
    subtitle: 'Unified Operational Dispatch Ecosystem',
    desc: 'The physical tiffin carrier synchronizes directly with the DabbaIQ master kitchen desk, MongoDB Atlas persistence, and on-premise Gemma 2 local AI inference for zero-waste commercial meal operations.',
    tareWeight: 'Zero Waste Ops',
    thermalState: 'DPDPA Crypto-Signed',
    carrierTag: '#MB-404-LIVE-KDS',
    image: '/stitch/storyboard-03-screen.png',
    targetRoute: '/',
    targetLabel: 'Enter Master Kitchen Desk',
  },
];

export default function ExperiencePage() {
  const [activeState, setActiveState] = useState<number>(1);
  const [safetyBuffer, setSafetyBuffer] = useState<number>(12);
  const [renderMode, setRenderMode] = useState<'studio' | 'schematic'>('studio');
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [inspectionActive, setInspectionActive] = useState<boolean>(false);
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);

  const currentState = STORYBOARD_STATES[activeState - 1];

  // Calculated interactive buffer values
  const baselinePortions = 107;
  const bufferPortions = Math.round((baselinePortions * safetyBuffer) / 100);
  const totalPortions = baselinePortions + bufferPortions;

  // Check reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setIsReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Intersection Observer for scroll-driven state scrubbing
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observers: IntersectionObserver[] = [];
    STORYBOARD_STATES.forEach((st) => {
      const el = document.getElementById(`chapter-${st.id}`);
      if (!el) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveState(st.id);
            }
          });
        },
        { rootMargin: '-30% 0px -30% 0px', threshold: 0.2 }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, []);

  const scrollToChapter = (chapterId: number) => {
    const el = document.getElementById(`chapter-${chapterId}`);
    if (el) {
      el.scrollIntoView({ behavior: isReducedMotion ? 'auto' : 'smooth' });
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Operational Ribbon */}
      <div className="w-full bg-surface-container-high text-on-surface px-4 py-2 rounded-lg border border-outline-variant/40 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-primary-container text-white font-bold rounded-xs">
            CAD_REF: DAB-MUM-2026-T4
          </span>
          <span className="text-on-surface-variant hidden sm:inline">
            Central Kitchen Dadar East • Elevation Axis Z+85mm
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-secondary font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            62°C CORE STEAM ISO
          </span>
          <span className="text-outline">•</span>
          <span className="text-primary font-semibold">CALIBRATION PASS: 100%</span>
        </div>
      </div>

      {/* COVER HERO (Stitch Screen f069e818f817440b965722d7f6a4b92c) */}
      <div className="desk-card p-6 sm:p-8 lg:p-10 relative overflow-hidden bg-surface">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-full text-xs font-mono font-semibold text-primary">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span>STITCH SCROLL-DRIVEN EXPERIENCE • STAINLESS STEEL TIFFIN</span>
          </div>
          <h1 className="font-headline font-bold text-3xl sm:text-4xl lg:text-5xl text-primary tracking-tight leading-tight uppercase">
            EVERY DABBA<br />
            <span className="text-secondary italic font-serif">HAS A STORY.</span>
          </h1>
          <p className="font-body text-sm sm:text-base text-on-surface-variant max-w-2xl leading-relaxed">
            Scroll down to explore the mechanical four-tier disassembly in sequence. Every compartment resolves an operational bottleneck—from the moisture-locked bread boundary to the real-time wholesale grain ledger.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => scrollToChapter(1)}
              className="btn-secondary text-xs sm:text-sm shadow-sm py-2.5 px-4 font-bold flex items-center gap-2 cursor-pointer"
            >
              <span>Begin Storyboard Tour</span>
              <ChevronDown className="w-4 h-4 animate-bounce" />
            </button>
            <Link
              href="/"
              className="btn-primary text-xs sm:text-sm shadow-sm py-2.5 px-4 flex items-center gap-1.5"
            >
              <span>Skip to Kitchen Desk</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/project-info"
              className="px-3 py-2 bg-surface-container text-on-surface-variant hover:text-on-surface font-mono text-xs rounded-lg border border-outline-variant/40"
            >
              System Specs
            </Link>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKBENCH: SCROLLING CHAPTERS (LEFT) + STICKY TIFFIN VIEWPORT (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: 6 Scrollable Storyboard Chapters */}
        <div className="lg:col-span-6 space-y-12">
          {STORYBOARD_STATES.map((st) => (
            <div
              key={st.id}
              id={`chapter-${st.id}`}
              className={`desk-card p-6 transition-all duration-300 ${
                activeState === st.id
                  ? 'border-2 border-primary shadow-md bg-surface'
                  : 'opacity-70 hover:opacity-90 bg-surface-container-low'
              }`}
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-outline-variant/30 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-primary-container text-white font-bold">
                    STEP 0{st.id} / 06
                  </span>
                  <span className="font-bold text-primary">{st.stepName}</span>
                </div>
                <span className="text-on-surface-variant">{st.carrierTag}</span>
              </div>

              <div className="space-y-3">
                <h2 className="font-headline font-bold text-2xl text-primary tracking-tight">
                  {st.title}
                </h2>
                <h3 className="font-headline font-semibold text-sm text-secondary">
                  {st.subtitle}
                </h3>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                  {st.desc}
                </p>

                {/* Chapter-Specific Telemetry Details */}
                {st.id === 3 && (
                  <div className="mt-4 p-4 bg-surface-container rounded-xl border border-outline-variant/30 space-y-3 font-mono text-xs">
                    <div className="font-bold text-primary uppercase text-[11px]">
                      Stitch Screen 32062f15... Telemetry
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-on-surface">
                      <div className="p-2 bg-surface rounded border border-outline-variant/30">
                        <span className="text-[10px] text-on-surface-variant block">COMPONENT</span>
                        <span className="font-bold text-primary">ROTI / PHULKA</span>
                      </div>
                      <div className="p-2 bg-surface rounded border border-outline-variant/30">
                        <span className="text-[10px] text-on-surface-variant block">DIAMETER</span>
                        <span className="font-bold text-primary">142 mm (±0.25mm)</span>
                      </div>
                      <div className="p-2 bg-surface rounded border border-outline-variant/30">
                        <span className="text-[10px] text-on-surface-variant block">INTERNAL TEMP</span>
                        <span className="font-bold text-secondary">62°C STABLE</span>
                      </div>
                      <div className="p-2 bg-surface rounded border border-outline-variant/30">
                        <span className="text-[10px] text-on-surface-variant block">SCRAP AUDIT</span>
                        <span className="font-bold text-primary">1.8% YIELD</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Link to Corresponding Operational Route */}
                <div className="pt-3 flex items-center justify-between border-t border-outline-variant/30">
                  <Link
                    href={st.targetRoute}
                    className="btn-primary text-xs py-2 px-3 font-semibold flex items-center gap-1.5"
                  >
                    <span>{st.targetLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setActiveState(st.id)}
                    className="font-mono text-xs text-on-surface-variant hover:text-primary font-bold cursor-pointer"
                  >
                    Inspect in 3D Viewport ➔
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT COLUMN: Persistent Sticky Tiffin Viewport */}
        <div className="lg:col-span-6 sticky top-24 space-y-4">
          <div className="desk-card p-4 sm:p-6 bg-surface shadow-lg border-2 border-primary/20 relative">
            {/* Viewport Header */}
            <div className="flex items-center justify-between pb-3 mb-3 bg-surface-container-high/60 px-4 py-2 rounded-lg border border-outline-variant/30">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" />
                <span className="font-mono text-xs uppercase tracking-widest text-on-surface font-semibold">
                  ELEVATION VIEW: Z+85mm
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Render Mode Switcher */}
                <div className="inline-flex bg-surface-container p-0.5 rounded-lg border border-outline-variant/40 text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setRenderMode('studio')}
                    className={`px-2 py-1 rounded transition ${
                      renderMode === 'studio' ? 'bg-primary text-white font-bold' : 'text-on-surface-variant'
                    }`}
                  >
                    Studio
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenderMode('schematic')}
                    className={`px-2 py-1 rounded transition ${
                      renderMode === 'schematic' ? 'bg-primary text-white font-bold' : 'text-on-surface-variant'
                    }`}
                  >
                    Schematic
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCodeModal(true)}
                  className="p-1 rounded bg-surface hover:bg-surface-container text-on-surface-variant border border-outline-variant/30"
                  title="View Stitch Screen Asset"
                >
                  <FileCode2 className="w-3.5 h-3.5 text-primary" />
                </button>
              </div>
            </div>

            {/* Viewport Canvas Container */}
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-surface-container-high flex items-center justify-center border border-outline-variant/40 group">
              {renderMode === 'studio' ? (
                <>
                  <img
                    src={currentState.image}
                    alt={currentState.title}
                    className="w-full h-full object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent pointer-events-none"></div>
                </>
              ) : (
                /* Vector Schematic View */
                <div className="w-56 flex flex-col items-center py-8">
                  <div
                    className={`transition-all duration-500 flex flex-col items-center ${
                      activeState >= 2 ? '-translate-y-8' : 'translate-y-0'
                    }`}
                  >
                    <div className="w-28 h-12 border-4 border-primary rounded-t-full flex items-center justify-center relative">
                      <div className="w-10 h-2 bg-primary rounded-full absolute -top-1"></div>
                    </div>
                    <div className="w-44 h-8 bg-gradient-to-r from-stone-200 via-stone-100 to-stone-300 rounded-t-lg border border-stone-400 relative shadow-xs flex items-center justify-center">
                      <div className="w-36 h-1 bg-stone-300 rounded-full"></div>
                      {activeState >= 2 && (
                        <div className="absolute -top-4 flex gap-1 animate-pulse">
                          <Flame className="w-4 h-4 text-secondary animate-bounce" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tier 1 */}
                  <div
                    className={`transition-all duration-500 mt-1 w-44 h-14 bg-gradient-to-r from-stone-300 via-stone-100 to-stone-300 rounded border border-stone-400 shadow-sm flex flex-col items-center justify-center p-1 relative ${
                      activeState >= 3 ? '-translate-y-4 shadow-md' : ''
                    } ${activeState >= 4 ? '-translate-y-6' : ''}`}
                  >
                    <span className="font-mono text-[10px] font-bold text-stone-700">TIER 1 • ROTIS</span>
                    <div className="w-28 h-1.5 bg-secondary-fixed rounded-full mt-0.5"></div>
                  </div>

                  {/* Tier 2 */}
                  <div
                    className={`transition-all duration-500 mt-1 w-44 h-14 bg-gradient-to-r from-stone-300 via-stone-100 to-stone-300 rounded border border-stone-400 shadow-sm flex flex-col items-center justify-center p-1 relative ${
                      activeState >= 4 ? '-translate-y-2' : ''
                    }`}
                  >
                    <span className="font-mono text-[10px] font-bold text-stone-700">TIER 2 • DAL TADKA</span>
                    <div className="w-28 h-1.5 bg-tertiary-fixed rounded-full mt-0.5"></div>
                  </div>

                  {/* Tier 3 */}
                  <div
                    className={`transition-all duration-500 mt-1 w-44 h-14 bg-gradient-to-r from-stone-300 via-stone-100 to-stone-300 rounded border border-stone-400 shadow-sm flex flex-col items-center justify-center p-1 relative ${
                      activeState >= 4 ? 'translate-y-2' : ''
                    }`}
                  >
                    <span className="font-mono text-[10px] font-bold text-stone-700">TIER 3 • BASMATI RICE</span>
                    <div className="w-28 h-1.5 bg-stone-200 rounded-full mt-0.5"></div>
                  </div>

                  {/* Tier 4 */}
                  <div
                    className={`transition-all duration-500 mt-1 w-44 h-16 bg-gradient-to-r from-stone-300 via-stone-100 to-stone-300 rounded-b-lg border border-stone-400 shadow-sm flex flex-col items-center justify-center p-1 relative ${
                      activeState >= 4 ? 'translate-y-6' : ''
                    }`}
                  >
                    <span className="font-mono text-[10px] font-bold text-stone-700">TIER 4 • ALOO GOBI</span>
                    <div className="w-28 h-1.5 bg-primary-fixed rounded-full mt-0.5"></div>
                  </div>
                </div>
              )}

              {/* Top Right Pin: Callout */}
              <div className="absolute top-[26%] right-[6%] flex items-center gap-2 pointer-events-auto">
                <div className="relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-secondary-container opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary-container"></span>
                </div>
                <div className="bg-surface/95 backdrop-blur-md px-2.5 py-1 rounded shadow-md border border-outline-variant/30 text-left flex flex-col">
                  <span className="text-secondary font-mono text-[10px] font-bold">
                    {activeState >= 3 ? 'TIER 04 DETACHED' : 'LATENT CLAMPED'}
                  </span>
                  <span className="font-mono text-[9px] text-on-surface-variant">AIR GAP ACTIVE</span>
                </div>
              </div>

              {/* Bottom Stamp */}
              <div className="absolute bottom-3 left-3 hidden sm:flex items-center gap-1.5 bg-surface/90 backdrop-blur-sm px-2.5 py-1 rounded border border-outline-variant/30">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="font-mono text-[10px] text-primary font-semibold uppercase">
                  SS 304 Food-Grade Alloy
                </span>
              </div>

              {/* Bottom Right Telemetry */}
              <div className="absolute bottom-3 right-3 bg-surface/90 backdrop-blur-sm px-2.5 py-1 rounded font-mono text-[10px] text-on-surface-variant border border-outline-variant/30">
                AXIS: Z+85mm // 0.00°
              </div>
            </div>

            {/* Bottom Scrubber Strip */}
            <div className="mt-4 pt-3 border-t border-outline-variant/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-on-surface font-bold">SCRUBBER PROGRESSION:</span>
                <span className="text-primary font-bold">{Math.round((activeState / 6) * 100)}%</span>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {STORYBOARD_STATES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setActiveState(st.id);
                      scrollToChapter(st.id);
                    }}
                    className={`py-1.5 rounded text-center font-mono text-[11px] font-bold transition-all cursor-pointer ${
                      activeState === st.id
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    0{st.id}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STITCH SOURCE INSPECTOR MODAL */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border-2 border-primary/20 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-surface-container flex items-center justify-between border-b border-outline-variant/40">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="font-headline font-bold text-sm text-primary">
                    Stitch Screen: Storyboard 03 — Upper Container Separating
                  </h4>
                  <span className="font-mono text-[10px] text-on-surface-variant">
                    ID: 32062f15acac4cb4b2c55fe6c3342af0 • Project: 1933848754259984407
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="p-1 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <span className="font-mono text-xs font-bold text-primary block mb-2">
                  1. Downloaded Stitch Screenshot Asset
                </span>
                <div className="rounded-xl overflow-hidden border border-outline-variant/40 bg-surface-container-low">
                  <img
                    src="/stitch/storyboard-03-screen.png"
                    alt="Stitch Storyboard 03 Screen"
                    className="w-full h-auto max-h-[420px] object-contain mx-auto"
                  />
                </div>
              </div>

              <div>
                <span className="font-mono text-xs font-bold text-primary block mb-2">
                  2. Local Verification Paths
                </span>
                <div className="bg-surface-container-high p-3 rounded-lg font-mono text-xs space-y-1 text-on-surface">
                  <div>
                    <span className="text-secondary font-bold">Image Asset:</span>{' '}
                    <code>frontend/public/stitch/storyboard-03-screen.png</code>
                  </div>
                  <div>
                    <span className="text-secondary font-bold">HTML Spec:</span>{' '}
                    <code>frontend/public/stitch/storyboard-03-code.html</code>
                  </div>
                  <div>
                    <span className="text-secondary font-bold">Design Reference:</span>{' '}
                    <code>docs/design-reference/stitch/storyboard-03-code.html</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-surface-container border-t border-outline-variant/40 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="btn-primary text-xs py-2 px-4 cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
