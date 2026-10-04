'use client';

import React from 'react';
import { Wifi } from 'lucide-react';

export function WebSocketCard() {
  return (
    <div className="glass-card rounded-2xl p-5 border border-indigo-500/20 bg-gradient-to-b from-slate-900 to-indigo-950/30 space-y-3">
      <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
        <Wifi className="w-4 h-4 animate-pulse text-emerald-400" />
        <span>Gotowość do WebSockets / Socket.io</span>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">
        Struktura aplikacji została zorganizowana pod kątem natychmiastowej integracji Pusher/Socket.io dla trybu multiplayer graczy.
      </p>
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-indigo-300 space-y-1">
        <div>{"// Emisja zdarzenia rzutu kością:"}</div>
        <div className="text-emerald-400">
          socket.emit(&apos;roll:broadcast&apos;, &#123; player, total &#125;)
        </div>
      </div>
    </div>
  );
}
