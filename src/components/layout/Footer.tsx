'use client';

import { Database, ShieldCheck, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 px-6 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" /> System Ready
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1 text-slate-400">
            <Database className="w-3.5 h-3.5 text-indigo-400" /> PostgreSQL & Prisma 7.9.1
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
          <span>D&D 5e SRD API Synchronized</span>
          <Sparkles className="w-3 h-3 text-amber-500" />
        </div>
      </div>
    </footer>
  );
}
