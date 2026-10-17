import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'DabbaIQ — Inside the Dabba | Kitchen Operations Desk',
  description:
    'Operational intelligence, grounded AI portion planning, and food-waste prevention for Indian tiffin services and commercial kitchens.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Epilogue:wght@600;700;800&family=JetBrains+Mono:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-on-surface antialiased selection:bg-tertiary-fixed selection:text-on-tertiary-fixed">
        <Navbar />
        <main className="flex-1 w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="border-t border-outline-variant/60 bg-surface-container-low py-6 text-xs text-on-surface-variant mt-12">
          <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-sm bg-primary-container flex flex-col items-center justify-center p-0.5">
                <div className="w-3 h-0.5 bg-tertiary-fixed rounded-xs mb-0.5" />
                <div className="w-3 h-0.5 bg-white rounded-xs mb-0.5" />
                <div className="w-3 h-0.5 bg-white rounded-xs" />
              </div>
              <span className="font-headline font-bold text-primary tracking-tight">DabbaIQ</span>
              <span className="font-mono text-[11px] text-on-surface-variant">
                — Inside the Dabba • Modern Kitchen Ops Desk
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-on-surface-variant">
              <a href="/privacy" className="hover:text-primary hover:underline transition">
                Privacy &amp; DPDP Notice
              </a>
              <span>•</span>
              <a href="/terms" className="hover:text-primary hover:underline transition">
                Terms of Service
              </a>
              <span>•</span>
              <span className="text-primary font-semibold">Gemma 2</span>
              <span>•</span>
              <span>MongoDB</span>
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
