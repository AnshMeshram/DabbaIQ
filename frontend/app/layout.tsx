import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'DabbaIQ — AI Kitchen Prep & Food-Waste Planner',
  description: 'Kitchen operations assistant for small Indian tiffin services and cloud kitchens. Cook the right amount. Waste less. Earn more.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#1C1917]">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="border-t border-[#E7E5E4] bg-[#FFFFFF] py-6 text-xs text-[#78716C] mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1B4332]">🍱 DabbaIQ</span>
              <span>— Open-Weight AI Kitchen Planning MVP for Hacktoberfest 2026</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-stone-500">
              <a href="/privacy" className="hover:text-emerald-700 underline transition">Privacy &amp; DPDP Notice</a>
              <span>•</span>
              <a href="/terms" className="hover:text-emerald-700 underline transition">Terms &amp; Licenses</a>
              <span>•</span>
              <span>Gemma</span>
              <span>•</span>
              <span>SerpAPI</span>
              <span>•</span>
              <span>Tiger Data</span>
              <span>•</span>
              <span>Temporal</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
