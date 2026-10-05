'use client';

import { FileText } from 'lucide-react';

interface GmNotesProps {
  notes: string;
  onChangeNotes: (notes: string) => void;
}

export function GmNotes({ notes, onChangeNotes }: GmNotesProps) {
  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
      <h4 className="font-bold text-slate-100 flex items-center gap-2">
        <FileText className="w-5 h-5 text-emerald-400" />
        Notatki Prowadzącego
      </h4>
      <textarea
        rows={4}
        value={notes}
        onChange={(e) => onChangeNotes(e.target.value)}
        placeholder="Zapisuj ważne wydarzenia, skarby i efekty sesji..."
        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
      />
    </div>
  );
}
