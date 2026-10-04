'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, Plus, X } from 'lucide-react';
import { AVAILABLE_CONDITIONS } from './types';

interface ConditionsDropdownProps {
  conditions: string[];
  onToggleCondition: (condition: string) => void;
}

export function ConditionsDropdown({
  conditions,
  onToggleCondition,
}: ConditionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex flex-wrap items-center gap-1.5">
        {conditions.map((cond) => (
          <span
            key={cond}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/15 border border-amber-500/30 text-amber-300"
          >
            <AlertCircle className="w-3 h-3" />
            {cond}
            <button
              type="button"
              onClick={() => onToggleCondition(cond)}
              className="hover:text-rose-400 focus:outline-none"
              title={`Usuń ${cond}`}
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-card hover:bg-surface-card-hover border border-border-subtle text-muted hover:text-foreground transition-colors"
        >
          <Plus className="w-2.5 h-2.5" />
          <span>Stan</span>
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-40 w-52 p-2 rounded-xl bg-surface-panel border border-border-default shadow-xl backdrop-blur-md">
          <p className="text-[11px] font-semibold text-muted px-2 py-1 uppercase tracking-wider">
            Stany i efekty D&D
          </p>
          <div className="max-h-48 overflow-y-auto space-y-0.5 mt-1">
            {AVAILABLE_CONDITIONS.map((cond) => {
              const active = conditions.includes(cond);
              return (
                <button
                  key={cond}
                  type="button"
                  onClick={() => onToggleCondition(cond)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg text-left transition-colors ${
                    active
                      ? 'bg-amber-500/20 text-amber-300 font-medium'
                      : 'text-muted hover:text-foreground hover:bg-surface-card-hover'
                  }`}
                >
                  <span>{cond}</span>
                  {active && <span className="text-[10px] text-amber-400 font-bold">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
