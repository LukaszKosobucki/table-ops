# Wymogi Techniczne i Architektura Stacku — Dice Tray & Roller

Dokument precyzuje dobór bibliotek, architekturę danych oraz integrację modułu rzutnika kości z ekosystemem aplikacji.

---

## 1. Rekomendowane Pakiety i Narzędzia

| Kategoria | Rekomendowane rozwiązanie | Alternatywa | Uzasadnienie |
| :--- | :--- | :--- | :--- |
| **Silnik Kości 3D** | `@3d-dice/dice-box` | `Three.js` + `cannon-es` | Gotowe modele wielościanów d4-d100, zintegrowana fizyka, wbudowane wsparcie dla kolorowania ścianek i cyfr. |
| **Warstwa Draggable** | `react-rnd` / `@neodrag/react` | Natywny Pointer Events API | Obsługa przeciągania i zmiany rozmiaru z zachowaniem akceleracji sprzętowej (`translate3d`). |
| **Generowanie Losowości**| Web Crypto API (`window.crypto`) | `prando` (seeded PRNG) | Zapewnienie pełnej nieprzewidywalności rzutów bez anomalii standardowego `Math.random()`. |

---

## 2. Model Danych (TypeScript Interfaces)

```typescript
export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export interface DiceGroup {
  type: DiceType;
  count: number;
}

export interface RollRequest {
  id: string;
  dice: DiceGroup[];
  modifier: number;
  advantageMode?: 'none' | 'advantage' | 'disadvantage';
  isSecret: boolean;
  sourceContext?: {
    characterId?: string;
    actionName?: string;
  };
}

export interface SingleDieResult {
  type: DiceType;
  value: number;
  ignored?: boolean; // np. przy rzutach z advantage/disadvantage
}

export interface RollResult {
  id: string;
  requestId: string;
  timestamp: string;
  diceResults: SingleDieResult[];
  modifier: number;
  total: number;
  formula: string; // np. "4d6 + 2d10 + 4"
  isSecret: boolean;
  actorName: string;
}
```

---

## 3. Schemat Kolorów Kości (Design Tokens)

Dla zachowania spójności interfejsu poszczególne typy kości korzystają ze zdefiniowanych tokenów kolorystycznych:

```scss
$dice-d4:   #06b6d4; // Cyan 500
$dice-d6:   #22c55e; // Green 500
$dice-d8:   #a855f7; // Purple 500
$dice-d10:  #eab308; // Yellow 500
$dice-d12:  #f97316; // Orange 500
$dice-d20:  #ef4444; // Red 500
$dice-d100: #64748b; // Slate 500
```

---

## 4. Architektura Przepływu Danych (Data Flow)

1. **Trigger:** Akcja użytkownika (przycisk w nagłówku, skrót klawiszowy `D` lub szybka akcja potwora/postaci w trackerze potyczki / karcie postaci).
2. **Kompozycja puli:** Zbudowanie obiektu `RollRequest`.
3. **Kalkulacja deterministyczna:** Wygenerowanie losowych wyników numerycznych za pomocą `crypto.getRandomValues()`.
4. **Symulacja wizualna:** Przekazanie oczekiwanych wyników do instancji `@3d-dice/dice-box` w celu uruchomienia animacji rzutu.
5. **Dispatch do Osi Czasu:** Publikacja wyliczonego obiektu `RollResult` do centralnego store'u aplikacji z renderowaniem wpisu w sekcji „Oś Czasu Sesji”.
