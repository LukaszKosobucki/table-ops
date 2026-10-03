# TableOps Design System & Styleguide

> **Single Source of Truth** for TableOps (D&D 5e Game Master Cockpit).  
> All frontend components must strictly adhere to the tokens, patterns, and conventions defined in this document.

---

## 1. Design Philosophy: The GM Cockpit

TableOps is designed as an **immersive, high-efficiency Game Master Cockpit**:
1. **Low Visual Fatigue (Dark Fantasy Void):** Deep obsidian/void canvas (`#090d16`) with layered frosted-glass surfaces rather than harsh solid dark grays.
2. **Instant Visual Hierarchy:**
   - **Arcane Indigo (`#6366f1`):** System operations, active selections, primary navigation, magical effects.
   - **Legendary Amber (`#d97706`):** Game Master controls, D&D branding, legendary actions, warnings.
   - **Role Identification:** Instantly distinguish **Heroes** (Emerald), **NPCs** (Amber), and **Monsters** (Rose).
3. **Glanceable Combat Status:** HP and turn orders are recognizable in fractions of a second through consistent color codes, health bars, and animated pulses.
4. **No Arbitrary Hex Codes:** Components **must not** use raw ad-hoc hex values (e.g. `bg-[#090d16]`, `border-[#1e293b]`). Use the semantic Tailwind tokens registered in `@theme`.

---

## 2. Global Design Tokens (Tailwind v4 `@theme`)

All tokens are defined in [src/app/globals.css](file:///Users/lukaszkosobucki/Documents/table-ops/src/app/globals.css) and mirrored in TypeScript at [src/lib/theme.ts](file:///Users/lukaszkosobucki/Documents/table-ops/src/lib/theme.ts).

### A. Surfaces & Backgrounds

| Token | Class Utility | Value | Intended Usage |
| :--- | :--- | :--- | :--- |
| `--color-app-bg` | `bg-app-bg` | `#090d16` | Root application background. |
| `--color-surface-panel` | `bg-surface-panel` | `#0d1322` | Navigation bars, headers, sticky footers. |
| `--color-surface-card` | `bg-surface-card` | `#131b2e` | Default card and panel background. |
| `--color-surface-card-hover` | `bg-surface-card-hover` | `#1c2742` | Interactive cards hover state. |
| `--color-surface-elevated` | `bg-surface-elevated` | `#1e293b` | Modals, flyout menus, tooltips, popovers. |
| `--color-surface-overlay` | `bg-surface-overlay` | `rgba(4, 7, 13, 0.8)` | Modal backdrops and drawer scrims. |

### B. Borders

| Token | Class Utility | Value | Intended Usage |
| :--- | :--- | :--- | :--- |
| `--color-border-subtle` | `border-border-subtle` | `rgba(255, 255, 255, 0.08)` | Default card border inside glass panels. |
| `--color-border-default` | `border-border-default` | `#1e293b` | Structural dividers, tab bars, standard outlines. |
| `--color-border-hover` | `border-border-hover` | `rgba(99, 102, 241, 0.45)` | Hover state on interactive cards. |
| `--color-border-accent` | `border-border-accent` | `rgba(217, 119, 6, 0.45)` | Active turn cards and GM highlight boxes. |

### C. Brand & Accent Colors

| Token | Class Utility | Hex / RGBA | Intended Usage |
| :--- | :--- | :--- | :--- |
| `--color-brand-primary` | `bg-brand-primary` / `text-brand-primary` | `#6366f1` (Indigo 500) | Primary buttons, active tabs, system focus. |
| `--color-brand-primary-hover` | `bg-brand-primary-hover` | `#4f46e5` (Indigo 600) | Primary button hover state. |
| `--color-brand-accent` | `bg-brand-accent` / `text-brand-accent` | `#d97706` (Amber 600) | GM actions, critical dice results, D&D badges. |
| `--color-brand-accent-hover` | `bg-brand-accent-hover` | `#b45309` (Amber 700) | Accent button hover state. |

### D. Entity Roles (Hero vs. NPC vs. Monster)

| Entity Role | Text / Border Token | Background Subtle Token | Usage |
| :--- | :--- | :--- | :--- |
| **Player Hero** | `text-role-hero` (`#10b981`) | `bg-role-hero-subtle` (`rgba(16, 185, 129, 0.12)`) | Player characters, ally summons. |
| **Important NPC** | `text-role-npc` (`#f59e0b`) | `bg-role-npc-subtle` (`rgba(245, 158, 11, 0.12)`) | Questgivers, story characters, neutrals. |
| **Monster / Enemy** | `text-role-monster` (`#f43f5e`) | `bg-role-monster-subtle` (`rgba(244, 63, 94, 0.12)`) | Bestiary foes, hostile combatants. |

### E. Health & Vitality Spectrum

| Status | Threshold | Color Token | Class / Indicator |
| :--- | :--- | :--- | :--- |
| **Healthy** | `HP > 50%` | `--color-status-healthy` (`#10b981`) | Emerald dot, emerald progress bar. |
| **Bloodied** | `HP <= 50%` | `--color-status-bloodied` (`#f59e0b`) | Amber dot, amber progress bar. |
| **Critical** | `HP <= 20%` | `--color-status-critical` (`#f97316`) | Orange dot (pulsing), orange progress bar. |
| **Unconscious / Dead** | `HP == 0` | `--color-status-dead` (`#e11d48`) | Rose badge with Skull icon (`Skull`). |

### F. Combat Turns & Timeline Logs

| Concept | Token | Value | Meaning |
| :--- | :--- | :--- | :--- |
| **Active Turn** | `--color-turn-active` | `#fbbf24` (Amber 400) | Currently acting combatant in combat queue. |
| **On Deck / Next** | `--color-turn-next` | `#818cf8` (Indigo 400) | Combatant acting immediately next. |
| **Short / Long Rest** | `--color-log-rest` | `#c084fc` (Purple 400) | Timeline entry for player recovery. |
| **Combat Concluded**| `--color-log-combat` | `#fb7185` (Rose 400) | Timeline summary of combat encounter. |
| **Spell Cast** | `--color-log-spell` | `#38bdf8` (Sky 400) | Timeline entry for spell resource usage. |
| **Tactical Action** | `--color-log-action` | `#fbbf24` (Amber 400) | Timeline log for GM narrative or combat hit. |

---

## 3. Glassmorphism & Elevation System

```
Layer 3: Modals, Drawers & Popovers  [ .glass-panel / bg-surface-elevated ] (z-50)
Layer 2: Interactive Content Cards   [ .glass-card / .glass-card-interactive ] (z-10)
Layer 1: Navigation & Header Bars    [ .glass-panel border-b border-border-default ] (z-40)
Layer 0: App Background Canvas       [ bg-app-bg ] (z-0)
```

### CSS Container Classes
* `.glass-panel`: Frosted glass container (`rgba(13, 19, 34, 0.82)`, `backdrop-blur-md`, subtle border). Used for navbar, sidebars, modal containers.
* `.glass-card`: Frosted card container (`rgba(19, 27, 46, 0.65)`, `backdrop-blur-sm`, subtle border).
* `.glass-card-interactive`: Interactive card with hover elevation (`transform: translateY(-1px)`), hover border glow, and pointer cursor.
* `.glass-card-active`: Selected card state with Indigo border and ambient glow (`box-shadow: 0 0 20px -2px rgba(99, 102, 241, 0.25)`).

### Ambient Glows
* `.glow-indigo`: Arcane glow for active spells or selections (`box-shadow: 0 0 16px rgba(99, 102, 241, 0.3)`).
* `.glow-amber`: Legendary glow for active turn or GM actions (`box-shadow: 0 0 16px rgba(217, 119, 6, 0.3)`).
* `.glow-emerald`: Vitality glow (`box-shadow: 0 0 16px rgba(16, 185, 129, 0.3)`).
* `.glow-rose`: Threat/Damage glow (`box-shadow: 0 0 16px rgba(244, 63, 94, 0.3)`).

---

## 4. Typography & Numerical Rules

* **Text Font (`font-sans`):** System UI (`Inter`, `Segoe UI`, `Roboto`). Clean, legibile at low contrast, responsive.
* **Numbers & Game Mechanics (`font-mono`):**  
  Always use `font-mono` for:
  - Hit Points: `28 / 28 HP`
  - Armor Class & Passive Perception: `AC 18`, `PP 14`
  - Ability Scores & Modifiers: `STR 16 (+3)`, `DEX 10 (+0)`
  - Dice Notation & Damage: `2d6 + 3`, `1d20`
  - Challenge Rating & XP: `CR 1/4 (50 XP)`
  - Round Counter & Timestamps: `Runda 2`, `19:42`

---

## 5. Reusable Component Patterns & Code Snippets

### A. Buttons

```tsx
// Primary Action Button (Indigo Gradient)
<button className="btn-primary">
  <Sparkles className="w-4 h-4" />
  <span>Rozpocznij Walkę</span>
</button>

// Secondary / Neutral Button (Muted Slate)
<button className="btn-secondary">
  <RotateCcw className="w-4 h-4" />
  <span>Resetuj Rundy</span>
</button>

// Accent / GM Highlight Button (Amber Gradient)
<button className="btn-accent">
  <Plus className="w-4 h-4" />
  <span>Nowa Sesja</span>
</button>

// Danger / Destructive Action Button (Rose)
<button className="btn-danger">
  <Trash2 className="w-4 h-4" />
  <span>Usuń Postać</span>
</button>

// Ghost / Minimal Button
<button className="btn-ghost">
  <span>Anuluj</span>
</button>
```

### B. Entity Role Badges

```tsx
// Player Character Badge
<span className="badge-hero">
  <User className="w-3 h-3" />
  <span>Bohater Gracza</span>
</span>

// Important NPC Badge
<span className="badge-npc">
  <Sparkles className="w-3 h-3" />
  <span>Ważny NPC</span>
</span>

// Monster Badge
<span className="badge-monster">
  <Swords className="w-3 h-3" />
  <span>Przeciwnik</span>
</span>
```

### C. Participant Health Status Indicators

```tsx
import { getHealthStatus } from '@/lib/theme';

export function ParticipantHealthIndicator({ currentHp, maxHp }: { currentHp: number; maxHp: number }) {
  const status = getHealthStatus(currentHp, maxHp);

  if (status.isDead) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
        <Skull className="w-3.5 h-3.5" />
        <span>Nieprzytomny</span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${status.dotClass}`} />
      <span className={`text-xs font-mono font-medium ${status.textClass}`}>
        {currentHp}/{maxHp} HP
      </span>
    </div>
  );
}
```

### D. Animated HP Progress Bar

```tsx
import { getHealthStatus } from '@/lib/theme';

export function HealthBar({ currentHp, maxHp }: { currentHp: number; maxHp: number }) {
  const status = getHealthStatus(currentHp, maxHp);
  const percentage = Math.min(100, Math.max(0, (currentHp / maxHp) * 100));

  return (
    <div className="hp-track">
      <div
        className={`hp-fill ${status.fillClass}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
```

### E. RPG Ability Score Box

```tsx
interface StatBoxProps {
  label: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';
  value: number;
}

export function StatBox({ label, value }: StatBoxProps) {
  const mod = Math.floor((value - 10) / 2);
  const formattedMod = mod >= 0 ? `+${mod}` : `${mod}`;

  return (
    <div className="stat-box">
      <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{label}</span>
      <span className="font-mono text-base font-bold text-slate-100">{value}</span>
      <span className="font-mono text-xs font-semibold text-amber-400">{formattedMod}</span>
    </div>
  );
}
```

### F. Condition Badge with Turn Countdown

```tsx
interface ConditionBadgeProps {
  name: string;
  durationTurns?: number;
  onRemove?: () => void;
}

export function ConditionBadge({ name, durationTurns, onRemove }: ConditionBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
      <span>{name}</span>
      {durationTurns !== undefined && (
        <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-indigo-500/20 text-amber-300 font-bold">
          {durationTurns}t
        </span>
      )}
      {onRemove && (
        <button onClick={onRemove} className="hover:text-rose-400 transition ml-0.5">
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
```

### G. Interactive Glass Card Container

```tsx
<div className="glass-card-interactive p-4 rounded-xl space-y-3">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-full bg-status-healthy" />
      <h3 className="font-semibold text-slate-100 text-sm">Valerius</h3>
    </div>
    <span className="badge-hero">Paladyn Lvl 3</span>
  </div>
  <p className="text-xs text-slate-400 line-clamp-2">
    Oddany sługa Światłości, wierny przysiędze obrony słabszych.
  </p>
  <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs text-slate-400">
    <span>AC: <strong className="font-mono text-slate-200">18</strong></span>
    <span>PP: <strong className="font-mono text-slate-200">14</strong></span>
    <span>HP: <strong className="font-mono text-emerald-400">28/28</strong></span>
  </div>
</div>
```

---

## 6. TypeScript Theme Helpers (`src/lib/theme.ts`)

Instead of computing health ratios or badge classes in component bodies, import the centralized helper functions from [src/lib/theme.ts](file:///Users/lukaszkosobucki/Documents/table-ops/src/lib/theme.ts):

* `getHealthStatus(currentHp, maxHp)`:
  Returns `{ state, label, dotClass, badgeClass, fillClass, textClass, isDead }`.
* `getRoleBadge(role)`:
  Returns `{ label, badgeClass }` for `'HERO' | 'NPC' | 'MONSTER'`.
* `getLogTypeBadge(type)`:
  Returns `{ label, badgeClass }` for `'REST_SHORT' | 'REST_LONG' | 'COMBAT_END' | 'SPELL_CAST' | 'COMBAT_ACTION'`.
* `THEME_COLORS`:
  Object with all theme hex values when needed by Canvas, charts, or SVG icons.

---

## 7. Developer Rules of Thumb

1. **Always use theme tokens:**
   - Prefer `bg-surface-card` over arbitrary colors.
   - Prefer `border-border-subtle` over inline `border-white/10`.
   - Prefer `text-brand-primary` / `text-brand-accent` over random colors.
2. **Numbers are always monospace:**
   - HP, AC, Dice, Modifiers, Turn indices, and Timestamps must use `font-mono`.
3. **Keep status icons consistent:**
   - Always use `Skull` for dead / 0 HP.
   - Always use `Shield` for AC.
   - Always use `Heart` for HP.
   - Always use `Eye` for Passive Perception.
   - Always use `Dices` for rolls and initiative.
4. **Smooth transitions:**
   - All interactive elements must declare `transition-all duration-200` or use `.glass-card-interactive`.
5. **No pure black or pure white:**
   - Do not use `#000000` (use `bg-app-bg` or `bg-surface-panel`).
   - Do not use `#ffffff` for text (use `text-slate-100` or `text-slate-200`).
