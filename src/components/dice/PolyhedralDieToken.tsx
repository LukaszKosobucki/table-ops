'use client';

import { Flame, Sparkles } from 'lucide-react';
import { DICE_CONFIG, type DiceType } from '@/lib/dice/types';

export interface PolyhedralDieTokenProps {
  type: string;
  value: number;
  ignored?: boolean;
  className?: string;
  size?: number;
}

/**
 * Authentic Polyhedral Die Shape Token
 * Renders geometric SVG shapes (d4 triangle, d6 square, d8 diamond, d10 kite,
 * d12 pentagon, d20 icosahedron, d100 percentile) with facet lines and centered rolled number.
 * Highlights Critical Success (Nat 20) with gold radiance and Critical Failure (Nat 1) with crimson flame.
 */
export function PolyhedralDieToken({
  type,
  value,
  ignored = false,
  className = '',
  size = 56,
}: PolyhedralDieTokenProps) {
  const isD20 = type === 'd20';
  const isCritSuccess = isD20 && value === 20 && !ignored;
  const isCritFailure = isD20 && value === 1 && !ignored;

  const meta = DICE_CONFIG[type as DiceType] || {
    label: type,
    sides: 20,
    colorHex: '#6366f1',
    borderColor: 'border-indigo-500',
    badgeBg: 'bg-indigo-950',
  };

  // Base stroke and fill colors
  let strokeColor = meta.colorHex;
  let fillColor = `${meta.colorHex}22`; // 13% opacity
  let textColor = '#ffffff';

  if (ignored) {
    strokeColor = '#475569';
    fillColor = 'rgba(15, 23, 42, 0.6)';
    textColor = '#94a3b8';
  } else if (isCritSuccess) {
    strokeColor = '#fbbf24'; // Radiant gold
    fillColor = 'rgba(245, 158, 11, 0.3)';
    textColor = '#fef08a';
  } else if (isCritFailure) {
    strokeColor = '#ef4444'; // Crimson
    fillColor = 'rgba(239, 68, 68, 0.3)';
    textColor = '#fca5a5';
  }

  const valStr = type === 'd100' && value < 10 ? `0${value}` : String(value);

  // Render authentic SVG geometry by die type
  const renderShapeSvg = () => {
    switch (type) {
      case 'd4':
        // Equilateral triangle
        return (
          <svg viewBox="0 0 56 56" className="w-full h-full filter drop-shadow" aria-hidden="true">
            {/* Outer Triangle */}
            <polygon
              points="28,6 50,47 6,47"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Inner Facet Lines meeting at center */}
            <line
              x1="28"
              y1="33"
              x2="28"
              y2="6"
              stroke={strokeColor}
              strokeWidth="1.2"
              strokeOpacity="0.45"
            />
            <line
              x1="28"
              y1="33"
              x2="50"
              y2="47"
              stroke={strokeColor}
              strokeWidth="1.2"
              strokeOpacity="0.45"
            />
            <line
              x1="28"
              y1="33"
              x2="6"
              y2="47"
              stroke={strokeColor}
              strokeWidth="1.2"
              strokeOpacity="0.45"
            />
            {/* Rolled number */}
            <text
              x="28"
              y="37"
              textAnchor="middle"
              fill={textColor}
              className="font-mono font-black text-[18px] tracking-tight select-none pointer-events-none"
            >
              {valStr}
            </text>
            {ignored && (
              <line
                x1="12"
                y1="46"
                x2="44"
                y2="12"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeOpacity="0.8"
              />
            )}
          </svg>
        );

      case 'd6':
        // Rounded Square / Cube
        return (
          <svg viewBox="0 0 56 56" className="w-full h-full filter drop-shadow" aria-hidden="true">
            <rect
              x="8"
              y="8"
              width="40"
              height="40"
              rx="7"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
            />
            {/* Subtle inner facet border */}
            <rect
              x="13"
              y="13"
              width="30"
              height="30"
              rx="4"
              fill="none"
              stroke={strokeColor}
              strokeWidth="1"
              strokeOpacity="0.3"
            />
            <text
              x="28"
              y="34"
              textAnchor="middle"
              fill={textColor}
              className="font-mono font-black text-[20px] tracking-tight select-none pointer-events-none"
            >
              {valStr}
            </text>
            {ignored && (
              <line
                x1="12"
                y1="44"
                x2="44"
                y2="12"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeOpacity="0.8"
              />
            )}
          </svg>
        );

      case 'd8':
        // Diamond / Octahedron
        return (
          <svg viewBox="0 0 56 56" className="w-full h-full filter drop-shadow" aria-hidden="true">
            <polygon
              points="28,5 51,28 28,51 5,28"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* 4 triangular facet ribs */}
            <line
              x1="28"
              y1="28"
              x2="28"
              y2="5"
              stroke={strokeColor}
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            <line
              x1="28"
              y1="28"
              x2="51"
              y2="28"
              stroke={strokeColor}
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            <line
              x1="28"
              y1="28"
              x2="28"
              y2="51"
              stroke={strokeColor}
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            <line
              x1="28"
              y1="28"
              x2="5"
              y2="28"
              stroke={strokeColor}
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            <text
              x="28"
              y="34"
              textAnchor="middle"
              fill={textColor}
              className="font-mono font-black text-[19px] tracking-tight select-none pointer-events-none"
            >
              {valStr}
            </text>
            {ignored && (
              <line
                x1="12"
                y1="44"
                x2="44"
                y2="12"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeOpacity="0.8"
              />
            )}
          </svg>
        );

      case 'd10':
      case 'd100':
        // Kite / Pentagonal Trapezohedron
        return (
          <svg viewBox="0 0 56 56" className="w-full h-full filter drop-shadow" aria-hidden="true">
            <polygon
              points="28,5 50,23 28,51 6,23"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Facet ribs */}
            <line
              x1="28"
              y1="24"
              x2="28"
              y2="5"
              stroke={strokeColor}
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            <line
              x1="28"
              y1="24"
              x2="50"
              y2="23"
              stroke={strokeColor}
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            <line
              x1="28"
              y1="24"
              x2="28"
              y2="51"
              stroke={strokeColor}
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            <line
              x1="28"
              y1="24"
              x2="6"
              y2="23"
              stroke={strokeColor}
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            <text
              x="28"
              y="33"
              textAnchor="middle"
              fill={textColor}
              className={`font-mono font-black tracking-tight select-none pointer-events-none ${
                type === 'd100' ? 'text-[15px]' : 'text-[18px]'
              }`}
            >
              {valStr}
            </text>
            {ignored && (
              <line
                x1="12"
                y1="44"
                x2="44"
                y2="12"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeOpacity="0.8"
              />
            )}
          </svg>
        );

      case 'd12':
        // Pentagon (Dodecahedron facet)
        return (
          <svg viewBox="0 0 56 56" className="w-full h-full filter drop-shadow" aria-hidden="true">
            <polygon
              points="28,6 50,22 42,48 14,48 6,22"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Subtle inner pentagon */}
            <polygon
              points="28,17 40,26 36,40 20,40 16,26"
              fill="none"
              stroke={strokeColor}
              strokeWidth="1"
              strokeOpacity="0.3"
            />
            <text
              x="28"
              y="35"
              textAnchor="middle"
              fill={textColor}
              className="font-mono font-black text-[18px] tracking-tight select-none pointer-events-none"
            >
              {valStr}
            </text>
            {ignored && (
              <line
                x1="12"
                y1="44"
                x2="44"
                y2="12"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeOpacity="0.8"
              />
            )}
          </svg>
        );

      default:
        // Hexagon with inner triangular icosahedron facets (d20)
        return (
          <svg viewBox="0 0 56 56" className="w-full h-full filter drop-shadow" aria-hidden="true">
            {/* Outer Hexagon */}
            <polygon
              points="28,5 49,17 49,39 28,51 7,39 7,17"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Inner triangular face */}
            <polygon
              points="28,16 41,37 15,37"
              fill={
                isCritSuccess
                  ? 'rgba(251, 191, 36, 0.25)'
                  : isCritFailure
                    ? 'rgba(239, 68, 68, 0.25)'
                    : 'none'
              }
              stroke={strokeColor}
              strokeWidth="1.3"
              strokeOpacity="0.5"
            />
            {/* Facet lines from triangle to outer corners */}
            <line
              x1="28"
              y1="16"
              x2="28"
              y2="5"
              stroke={strokeColor}
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            <line
              x1="28"
              y1="16"
              x2="49"
              y2="17"
              stroke={strokeColor}
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            <line
              x1="28"
              y1="16"
              x2="7"
              y2="17"
              stroke={strokeColor}
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            <line
              x1="41"
              y1="37"
              x2="49"
              y2="39"
              stroke={strokeColor}
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            <line
              x1="41"
              y1="37"
              x2="28"
              y2="51"
              stroke={strokeColor}
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            <line
              x1="15"
              y1="37"
              x2="7"
              y2="39"
              stroke={strokeColor}
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            <line
              x1="15"
              y1="37"
              x2="28"
              y2="51"
              stroke={strokeColor}
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            <text
              x="28"
              y="35"
              textAnchor="middle"
              fill={textColor}
              className="font-mono font-black text-[18px] tracking-tight select-none pointer-events-none"
            >
              {valStr}
            </text>
            {ignored && (
              <line
                x1="12"
                y1="44"
                x2="44"
                y2="12"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeOpacity="0.8"
              />
            )}
          </svg>
        );
    }
  };

  return (
    <div
      data-testid={`die-token-${type}`}
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center transition-transform hover:scale-105 ${
        isCritSuccess ? 'drop-shadow-[0_0_12px_rgba(245,158,11,0.7)] animate-pulse' : ''
      } ${isCritFailure ? 'drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]' : ''} ${className}`}
      title={
        isCritSuccess
          ? 'Krytyczny Sukces! (Naturalne 20)'
          : isCritFailure
            ? 'Krytyczny Pech! (Naturalne 1)'
            : ignored
              ? 'Rzut odrzucony'
              : `Wyrzucono ${value}`
      }
    >
      {renderShapeSvg()}

      {/* Critical Success Gold Sparkle Indicator */}
      {isCritSuccess && (
        <span
          data-testid="crit-success-indicator"
          className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300 flex items-center justify-center"
        >
          <Sparkles className="w-3 h-3 text-slate-950" />
        </span>
      )}

      {/* Critical Failure Crimson Flame Indicator */}
      {isCritFailure && (
        <span
          data-testid="crit-failure-indicator"
          className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-rose-600 text-white shadow-md ring-2 ring-rose-400 flex items-center justify-center"
        >
          <Flame className="w-3 h-3 text-white" />
        </span>
      )}
    </div>
  );
}
