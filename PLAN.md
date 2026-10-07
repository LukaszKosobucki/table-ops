# Plan Implementacji Aplikacji Game Master Tracker (D&D 5e / TableOps)

> Dokument przygotowany na podstawie specyfikacji technicznej, schematu bazy danych oraz historyjek użytkownika zawartych w katalogu `user-stories-and-spec/`.  
> Wszystkie moduły są podzielone na małe, weryfikowalne kroki (chunki) z precyzyjnymi kryteriami testowymi.  
> **Standard wizualny:** Kontynuacja istniejącego, dopracowanego stylu dark-mode / glassmorphism (`#090d16`, akcenty `indigo`/`amber`, Tailwind CSS v4, biblioteka ikon `lucide-react`, panele `glass-card`).

---

## 🎨 Wytyczne Spójności Wizualnej (Design System)

Wszystkie nowe widoki i komponenty **muszą** ściśle bazować na dotychczas zaimplementowanym stylu w [`src/app/globals.css`](file:///Users/lukaszkosobucki/Documents/table-ops/src/app/globals.css) i [`src/components/MainDashboard.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/MainDashboard.tsx):

* **Tło i paleta bazowa:** Głęboka czerń/granat `#090d16` (background), `#0f172a` (karty i panele), obramowania `border-slate-800/80` lub `border-slate-700/60`.
* **Kolory wiodące (Akcenty):**
  * **Primary (Magia / System):** Indigo (`#6366f1` / `bg-gradient-to-r from-indigo-600 to-indigo-700`).
  * **Accent (Mistrz Gry / D&D / Ogień):** Amber/Gold (`#d97706` / `text-amber-400`).
  * **Wskaźniki stanu życia:**
    * Żywy / Zdolny do walki: szmaragdowa kropka `w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50`.
    * Nieprzytomny / Martwy (HP = 0): czerwony badge `text-rose-400 bg-rose-500/10 border border-rose-500/30` z ikoną czaszki (`Skull`).
* **Efekty szkła (Glassmorphism):**
  * `.glass-panel`: `bg-slate-900/75 backdrop-blur-md border border-white/5`.
  * `.glass-card`: `bg-slate-800/60 backdrop-blur-sm border border-white/5 hover:border-indigo-500/40 hover:shadow-indigo-500/10`.
* **Typografia i dane:** Bezszeryfowy tekst podstawowy (`font-sans`), dane mechaniczne (statystyki, rzuty kośćmi, modyfikatory, obrażenia, logi czasu) w kroju `font-mono`.
* **Responsywność:** 3-kolumnowy kokpit GM-a na dużych ekranach, który na mniejszych ekranach składa się w intuicyjne zakładki lub wysuwane panele boczne (Drawers).

---

## 🗺️ Mapa Drogowa Implementacji (Roadmap)

```mermaid
flowchart TD
    K0["Krok 0: Migracja i Schemat Bazy Danych (Supabase PostgreSQL + Prisma)"]
    F1["Faza 1: Moduł Zarządzania Sesjami (Ekran Startowy)"]
    F2["Faza 2: Główny Panel Sesji (3-kolumnowy Dashboard GM-a)"]
    F3["Faza 3: Kreator i Zarządzanie Postaciami (Bohaterowie & NPC)"]
    F4["Faza 4: Grupy Potyczkowe (Encounter Builder)"]
    F5["Faza 5: Aktywna Potyczka (Combat Tracker & Cykl Tur)"]
    F6["Faza 6: Oś Czasu, Historia i System Odpoczynków (Short/Long Rest)"]
    F7["Faza 7: Rozbudowa Kompendium (Zaklęcia, Przedmioty & Proxy API)"]
    F8["Faza 8: Integracja Real-time (Kości), Testy E2E & Polerowanie"]

    K0 --> F1
    F1 --> F2
    F2 --> F3
    F3 --> F4
    F4 --> F5
    F5 --> F6
    F6 --> F7
    F7 --> F8
```

---

## KROK 0: Aktualizacja Schematu Bazy Danych (Supabase PostgreSQL + Prisma)

*Cel:* Zsynchronizowanie pliku [`prisma/schema.prisma`](file:///Users/lukaszkosobucki/Documents/table-ops/prisma/schema.prisma) ze specyfikacją [`user-stories-and-spec/schemat_bazy_danych.md`](file:///Users/lukaszkosobucki/Documents/table-ops/user-stories-and-spec/schemat_bazy_danych.md) oraz bazą Supabase (PostgreSQL). Głównym korzeniem logiki staje się encja `Session`.

### Chunk 0.1: Modele Sesji, Postaci i Potyczek w Prisma (✅ Zakończone)
* **Backend:**
  * Utworzenie modelu `Session` (`id`, `name`, `createdAt`, `updatedAt`).
  * Aktualizacja modelu `Character` (`sessionId`, `type` [HERO/NPC], `name`, `class`, `level`, `maxHp`, `currentHp`, `ac`, `stats` [JSON], `proficiencies` [JSON], `traits` [JSON], `inventory` [JSON], `spells` [JSON]).
  * Dodanie modeli grup potyczkowych: `EncounterGroup` (`id`, `sessionId`, `name`) oraz `EncounterMember` (`id`, `groupId`, `characterId?`, `apiMonsterId?`, `count`).
  * Dodanie modeli aktywnej walki: `Combat` (`id`, `sessionId`, `status` [PREPARING/ACTIVE/FINISHED], `currentRound`, `currentTurnIndex`, `createdAt`, `endedAt`), `Combatant` (`id`, `combatId`, `characterId?`, `apiMonsterId?`, `nameOverride`, `initiative`, `currentHp`, `maxHp`, `ac`, `order`), `CombatStatus` (`id`, `combatantId`, `statusName`, `durationTurns`).
  * Dodanie modelu historii: `SessionLog` (`id`, `sessionId`, `combatId?`, `logType` [REST_SHORT/REST_LONG/COMBAT_END/SPELL_CAST/COMBAT_ACTION], `description`, `metadata` [JSON], `createdAt`).
  * Zachowanie i powiązanie z istniejącym modelem `Monster`.
  * Dodanie indeksów na kluczach obcych (`@@index`) wg wytycznych wydajności Supabase PostgreSQL.
* **Weryfikacja / Testy:**
  * Wykonanie `npm run prisma:generate`.
  * Weryfikacja poprawności generowanych typów TypeScript w `node_modules/@prisma/client` oraz test w [`src/lib/prisma-schema.test.ts`](file:///Users/lukaszkosobucki/Documents/table-ops/src/lib/prisma-schema.test.ts).
  * Wykonanie pełnego suite testów Vitest, lintera Biome oraz Next.js build.

---

## FAZA 1: Moduł Zarządzania Sesjami (Ekran Startowy)
*User Stories:* [`user-stories-and-spec/user_stories_modu_sesji.md`](file:///Users/lukaszkosobucki/Documents/table-ops/user-stories-and-spec/user_stories_modu_sesji.md)  
*API Spec:* [`user-stories-and-spec/wymagania_crud_api.md`](file:///Users/lukaszkosobucki/Documents/table-ops/user-stories-and-spec/wymagania_crud_api.md) (Sekcja 1)

### Chunk 1.1: Backend – CRUD Sesji (✅ Zakończone)
* **Backend:**
  * Moduł domeny [`src/lib/sessions.ts`](file:///Users/lukaszkosobucki/Documents/table-ops/src/lib/sessions.ts) z walidacją nazwy (min. 2, max. 60 znaków), funkcjami `getSessions`, `createSession`, `updateSession`, `deleteSession` oraz wstrzykiwaniem klienta Prisma (DI).
  * Endpoint `GET /api/sessions`: zwraca listę sesji posortowaną po `updatedAt DESC` wraz z zagregowaną liczbą przypisanych postaci i logów (`_count: { characters, sessionLogs }`).
  * Endpoint `POST /api/sessions`: walidacja nazwy i utworzenie nowej sesji (HTTP 201).
  * Endpoint `PUT /api/sessions/[id]`: aktualizacja nazwy sesji z obsługą błędu 404 (HTTP 200).
  * Endpoint `DELETE /api/sessions/[id]`: usunięcie sesji z obsługą błędu 404 i kaskadowym usuwaniem powiązanych danych (HTTP 200).
* **Testowanie:**
  * Testy jednostkowe logiki i walidacji w [`src/lib/sessions.test.ts`](file:///Users/lukaszkosobucki/Documents/table-ops/src/lib/sessions.test.ts).
  * Testy integracyjne endpointów w [`src/app/api/sessions/sessions-api.test.ts`](file:///Users/lukaszkosobucki/Documents/table-ops/src/app/api/sessions/sessions-api.test.ts).

### Chunk 1.2: Frontend – Ekran Wyboru i Tworzenia Sesji (✅ Zakończone)
* **Frontend:**
  * Moduł widoku wyboru sesji [`src/components/sessions/SessionSelection.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/sessions/SessionSelection.tsx) z kafelkami istniejących kampanii, filtrowaniem po nazwie, datą aktualizacji, licznikami bohaterów i wpisów kroniki, akcjami przejścia, edycji oraz usunięcia.
  * Pusty stan (Empty State) zachęcający do stworzenia pierwszej sesji RPG.
  * Modal szybkiego tworzenia nowej sesji [`src/components/sessions/CreateSessionModal.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/sessions/CreateSessionModal.tsx) z automatycznym wyborem i przekierowaniem do kokpitu.
  * Modal edycji nazwy sesji [`src/components/sessions/EditSessionModal.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/sessions/EditSessionModal.tsx).
  * Przełącznik aktywnej sesji [`src/components/sessions/SessionSwitcher.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/sessions/SessionSwitcher.tsx) wbudowany w górny pasek nawigacji [`src/components/layout/Navbar.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/layout/Navbar.tsx).
  * Dynamiczne ładowanie widoku (`bundle-dynamic-imports`), zarządzanie stanem i obsługa localStorage w [`src/components/MainDashboard.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/MainDashboard.tsx).
  * Blokada dostępu na poziomie routingu (Access Guard): bez aktywnej sesji pozostałe moduły (Kokpit GM, Bestiariusz, Kreator, Kości) są zablokowane i oznaczone kłódkami w Navbarze, a próba wejścia z poziomu URL wymusza powrót do widoku sesji.
* **Testowanie:**
  * Testy komponentu w React Testing Library ([`src/components/sessions/SessionSelection.test.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/sessions/SessionSelection.test.tsx)): weryfikacja pustego stanu, renderowania kafelków, otwarcia modala i akcji tworzenia nowej sesji.

---

## FAZA 2: Główny Panel Sesji (3-kolumnowy Dashboard GM-a)
*User Stories:* [`user-stories-and-spec/user_stories_3_kolumnowy_kokpit_gm.md`](file:///Users/lukaszkosobucki/Documents/table-ops/user-stories-and-spec/user_stories_3_kolumnowy_kokpit_gm.md)  
*API Spec:* [`user-stories-and-spec/wymagania_crud_api.md`](file:///Users/lukaszkosobucki/Documents/table-ops/user-stories-and-spec/wymagania_crud_api.md) (Sekcja 7)

### Chunk 2.1: Backend – Full State Aggregator API (✅ Zakończone)
* **Backend:**
  * Endpoint `GET /api/sessions/[id]/full-state` zwracający w jednym zapytaniu:
    * Dane sesji (`session`).
    * Listę bohaterów i NPC (`characters`, posortowane po `createdAt ASC`).
    * Zdefiniowane grupy potyczkowe (`encounterGroups`) wraz z członkami (`members`) oraz powiązanymi danymi bestiariusza (`monster`) i bohaterów (`character`).
    * Aktywną walkę (`activeCombat`) ze statusem `PREPARING` lub `ACTIVE` wraz z uczestnikami (`combatants`, posortowane po `order ASC`) i ich statusami (`statuses`).
    * Ostatnie 20 wpisów z osi czasu sesji (`sessionLogs`, posortowane po `createdAt DESC`).
  * Funkcja domenowa `getSessionFullState` w [`src/lib/sessions.ts`](file:///Users/lukaszkosobucki/Documents/table-ops/src/lib/sessions.ts) z pojedynczym zapytaniem `prisma.session.findUnique({ include: { ... } })`.
  * Endpoint `GET /api/sessions/[id]/full-state` w [`src/app/api/sessions/[id]/full-state/route.ts`](file:///Users/lukaszkosobucki/Documents/table-ops/src/app/api/sessions/[id]/full-state/route.ts) z obsługą kodów 200, 400, 404 i 500.
* **Testowanie:**
  * Testy jednostkowe funkcji domenowej i struktury zapytań w [`src/lib/sessions.test.ts`](file:///Users/lukaszkosobucki/Documents/table-ops/src/lib/sessions.test.ts).
  * Testy integracyjne endpointu HTTP w [`src/app/api/sessions/[id]/full-state/full-state-api.test.ts`](file:///Users/lukaszkosobucki/Documents/table-ops/src/app/api/sessions/[id]/full-state/full-state-api.test.ts).
  * Test wydajnościowy zapytania w pamięci (< 100ms) oraz pomyślna weryfikacja bezpośredniego odpytania bazy PostgreSQL Supabase.

### Chunk 2.2: Frontend – Implementacja Układu 3-Kolumnowego (✅ Zakończone)
* **Frontend:**
  * Refaktoryzacja [`src/components/MainDashboard.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/MainDashboard.tsx) i implementacja orkiestratora [`src/components/dashboard/GmDashboard.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/dashboard/GmDashboard.tsx) z układem 3-kolumnowym (siatka 12-kolumnowa Tailwind):
    * **Lewa Kolumna ([`src/components/dashboard/PartySidebar.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/dashboard/PartySidebar.tsx)):** stała szerokość (~300px), kompaktowe karty postaci (Avatar/Inicjał, Pasek HP z dynamicznym kolorem, wskaźniki witalności: Healthy, Bloodied, Critical z pulsem, Dead z czaszką 0 HP, AC z tarczą, Pasywna Percepcja z okiem). Kliknięcie karty otwiera podgląd postaci w centrum.
    * **Środkowa Kolumna (Obszar Roboczy / Scena):** elastyczny kontener przełączany kontekstowo ([`src/components/dashboard/CharacterInspectionCard.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/dashboard/CharacterInspectionCard.tsx) do LARPowania i cech postaci, [`src/components/dashboard/LogInspectionCard.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/dashboard/LogInspectionCard.tsx) do szczegółów wpisów, oraz domyślny Tracker Inicjatywy [`src/components/initiative/InitiativeTracker.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/initiative/InitiativeTracker.tsx)).
    * **Prawa Kolumna ([`src/components/dashboard/TimelineSidebar.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/dashboard/TimelineSidebar.tsx)):** chronologiczna oś czasu sesji z odznaczeniami typów zdarzeń, podręczny moduł rzutów kośćmi (d4, d6, d8, d10, d12, d20, d100) z natychmiastowym wynikiem oraz podręczne notatki GM-a.
  * Zapewnienie pełnej responsywności: na ekranach mobilnych i tabletach (< lg) kolumny są składane do przełącznika zakładek (`[Drużyna]`, `[Scena Walki]`, `[Oś Czasu]`).
* **Testowanie:**
  * Testy jednostkowe w React Testing Library dla [`src/components/dashboard/PartySidebar.test.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/dashboard/PartySidebar.test.tsx) oraz [`src/components/dashboard/GmDashboard.test.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/dashboard/GmDashboard.test.tsx) (84/84 testy zielone).
  * Testy E2E Playwright ([`e2e/dashboard-3col.spec.ts`](file:///Users/lukaszkosobucki/Documents/table-ops/e2e/dashboard-3col.spec.ts)): weryfikacja renderowania 3 kolumn na rozdzielczości Desktop (1920x1080), interaktywnej inspekcji oraz poprawnego działania przełącznika mobilnego na widoku (375x667). Wszystkie 9 testów E2E zielone.

---

## FAZA 3: Kreator i Zarządzanie Postaciami (Bohaterowie i NPC)
*User Stories:* [`user-stories-and-spec/user_stories_kreator_i_karty_postaci.md`](file:///Users/lukaszkosobucki/Documents/table-ops/user-stories-and-spec/user_stories_kreator_i_karty_postaci.md)  
*API Spec:* [`user-stories-and-spec/wymagania_crud_api.md`](file:///Users/lukaszkosobucki/Documents/table-ops/user-stories-and-spec/wymagania_crud_api.md) (Sekcja 2)

### Chunk 3.1: Backend – Obsługa Postaci i Reguł SRD ✅
* **Status:** Zrealizowany i przetestowany.
* **Backend:**
  * Domena [`src/lib/characters.ts`](file:///Users/lukaszkosobucki/Documents/table-ops/src/lib/characters.ts): walidacja, kalkulacje D&D 5e, CRUD i mutacje HP/slotów.
  * Reguły D&D 5e [`src/lib/dnd-rules.ts`](file:///Users/lukaszkosobucki/Documents/table-ops/src/lib/dnd-rules.ts): kalkulator kości życia `getClassHitDie` (d12, d10, d8, d6), pełna macierz slotów czarów 1-20 `calculateSpellSlots` (Full Caster, Half Caster, Warlock Pact Magic), mechanika absorpcji obrażeń przez punkty tymczasowe `applyDamage`, leczenie `applyHealing`, reguła niestakowania `tempHp` `applyTempHp` oraz zarządzanie komórkami czarów `modifySpellSlot`.
  * `POST /api/characters`: tworzenie i walidacja postaci przypisanej do sesji.
  * `GET /api/characters/[id]`, `PUT /api/characters/[id]`, `DELETE /api/characters/[id]`: pełny CRUD pojedynczej postaci.
  * `PATCH /api/characters/[id]/hp`: szybka mutacja HP (obrażenia, leczenie, punkty tymczasowe, format delta).
  * `PATCH /api/characters/[id]/slots`: używanie, odzyskiwanie i ustawianie slotów czarów.
  * `GET /api/sessions/[id]/characters`, `POST /api/sessions/[id]/characters`: operacje na postaciach w kontekście sesji.
* **Testowanie:**
  * [`src/lib/dnd-rules.test.ts`](file:///Users/lukaszkosobucki/Documents/table-ops/src/lib/dnd-rules.test.ts) (19 testów jednostkowych reguł SRD).
  * [`src/lib/characters.test.ts`](file:///Users/lukaszkosobucki/Documents/table-ops/src/lib/characters.test.ts) (21 testów jednostkowych serwisu postaci).
  * [`src/app/api/characters/characters-api.test.ts`](file:///Users/lukaszkosobucki/Documents/table-ops/src/app/api/characters/characters-api.test.ts) (15 testów integracyjnych endpointów REST).

### Chunk 3.2: Frontend – Kreator Postaci (Krok po Kroku) & Szybka Karta (✅ Zakończone)
* **Frontend ([`src/components/characters/`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/characters/)):**
  * Wielokrokowy wizard tworzenia bohatera i NPC:
    * Krok 1: Tożsamość (Imię, Rasa, Klasa, Poziom, Typ: Bohater/NPC, wskazówki odgrywania LARP dla MG).
    * Krok 2: Statystyki (Standard Array: 15, 14, 13, 12, 10, 8 lub rzut kośćmi 4d6 drop lowest via `roll4d6DropLowest`).
    * Krok 3: Pancerz i Życie (automatyczna kalkulacja bazowego HP wg kości k6/k8/k10/k12 + MOD Kondycji, pasywna percepcja 10 + WIS mod, unarmored AC).
    * Krok 4: Podsumowanie & Magia (podgląd slotów czarów wg tabeli czarowników D&D 5e dla klas rzucających czary, zapis asynchroniczny `POST /api/characters`).
  * Rozbudowana Karta Postaci w Środkowej Kolumnie ([`src/components/dashboard/CharacterInspectionCard.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/dashboard/CharacterInspectionCard.tsx)):
    * Interaktywne zarządzanie HP (szybkie przyciski `-1`, `-5`, `-10`, `+1`, `+5`, `+10`, absorpcja przez punkty tymczasowe `tempHp`, dedykowany modal z akcjami obrażeń/leczenia/punktów tymczasowych, mutacje `PATCH /api/characters/[id]/hp`).
    * Klikalne sloty czarów z podglądem zużycia (kropki `●` wolny / `○` zużyty) z bezpośrednią synchronizacją przez `PATCH /api/characters/[id]/slots`.
    * Interaktywne testy atrybutów i rzuty obronne d20 + modyfikator z animowanym bannerem wyników rzutu.
    * Dwukierunkowa synchronizacja stanu z `GmDashboard.tsx` (`onCharacterUpdate`).
* **Testowanie:**
  * Testy komponentów w Vitest / React Testing Library:
    * [`src/components/characters/CharacterWizard.test.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/characters/CharacterWizard.test.tsx) – test nawigacji krok po kroku kreatora, generowania Standard Array, przeliczeń D&D, podglądu slotów magii oraz zapisu przez API.
    * [`src/components/dashboard/CharacterInspectionCard.test.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/dashboard/CharacterInspectionCard.test.tsx) – test interaktywnego zarządzania HP, klikania slotów czarów, rzutów d20 na atrybuty i rzuty obronne.
  * Wszystkie testy jednostkowe (139/139), lint Biome (107 plików, 0 błędów), build Turbopack oraz E2E Playwright (9/9) zakończone sukcesem.

---

## FAZA 4: Zarządzanie Grupami Potyczkowymi (Encounter Builder)
*User Stories:* [`user-stories-and-spec/user_stories_zarzadzanie_potyczkami.md`](file:///Users/lukaszkosobucki/Documents/table-ops/user-stories-and-spec/user_stories_zarzadzanie_potyczkami.md)  
*API Spec:* [`user-stories-and-spec/wymagania_crud_api.md`](file:///Users/lukaszkosobucki/Documents/table-ops/user-stories-and-spec/wymagania_crud_api.md) (Sekcja 3)

### Chunk 4.1: Backend – Modelowanie i Zapis Grup Potyczkowych (✅ Zakończone)
* **Backend:**
  * Domena [`src/lib/encounters.ts`](file:///Users/lukaszkosobucki/Documents/table-ops/src/lib/encounters.ts): walidacja danych wejściowych `validateEncounterInput`, operacje pobierania `getEncountersBySession` i `getEncounterById`, tworzenie grup potyczkowych `createEncounter`, atomowa wymiana członków grupy w transakcji `updateEncounter` oraz usuwanie `deleteEncounter`.
  * Reguły D&D 5e w [`src/lib/dnd-rules.ts`](file:///Users/lukaszkosobucki/Documents/table-ops/src/lib/dnd-rules.ts):
    * Progi doświadczenia drużyny DMG `calculatePartyXpThresholds` (Easy, Medium, Hard, Deadly dla poziomów 1-20).
    * Mnożnik spotkania DMG `getEncounterMultiplier` uwzględniający liczbę potworów oraz korektę na wielkość drużyny (< 3 bohaterów lub >= 6 bohaterów).
    * Kompleksowy ewaluator trudności `calculateEncounterDifficulty` zwracający sumaryczne XP, skorygowane XP, mnożnik, progi punktowe i wyliczony poziom trudności (`trivial`, `easy`, `medium`, `hard`, `deadly`).
  * Endpoint `GET /api/sessions/[id]/encounters`: lista grup potyczkowych dla danej sesji ze złączonymi relacjami potworów i bohaterów.
  * Endpoint `POST /api/sessions/[id]/encounters`: tworzenie nowej grupy potyczkowej w kontekście sesji.
  * Endpoint `POST /api/encounters`: top-level endpoint tworzenia grupy potyczkowej.
  * Endpoint `GET /api/encounters/[id]`: szczegóły pojedynczej grupy potyczkowej wraz z członkami.
  * Endpoint `PUT /api/encounters/[id]`: atomowa aktualizacja nazwy oraz wymiana członków potyczki w transakcji `$transaction`.
  * Endpoint `DELETE /api/encounters/[id]`: usunięcie grupy potyczkowej (kaskadowe usunięcie członków w Prisma).
* **Testowanie:**
  * [`src/lib/dnd-rules.test.ts`](file:///Users/lukaszkosobucki/Documents/table-ops/src/lib/dnd-rules.test.ts): 31 testów reguł D&D (w tym testy progów XP i kalkulatora trudności potyczek).
  * [`src/lib/encounters.test.ts`](file:///Users/lukaszkosobucki/Documents/table-ops/src/lib/encounters.test.ts): 14 testów jednostkowych logiki domenowej, walidacji i atomowych transakcji.
  * [`src/app/api/encounters/encounters-api.test.ts`](file:///Users/lukaszkosobucki/Documents/table-ops/src/app/api/encounters/encounters-api.test.ts): 10 testów integracyjnych endpointów REST.
  * Wszystkie 176 testów jednostkowych Vitest, 0 błędów Biome linter, czysty build Next.js/Turbopack oraz 9/9 testów E2E Playwright zielone.

### Chunk 4.2: Frontend – Kreator Potyczek (Encounter Builder UI) (✅ Zakończone)
* **Frontend:**
  * Komponent [`src/components/encounters/EncounterBuilder.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/encounters/EncounterBuilder.tsx) zintegrowany ze Środkową Kolumną [`src/components/dashboard/GmDashboard.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/dashboard/GmDashboard.tsx):
    * **Lista Zapisanych Zestawów:** przegląd zestawów potyczek dla sesji z podglądem składu grupy, łącznego bazowego XP, mnożnika oraz dynamicznego odznaczenia trudności (`DifficultyBadge`).
    * **Szybki Start Walki:** przycisk *"Załaduj do Inicjatywy"*, który automatycznie przekształca potwory z grupy w ponumerowanych uczestników walki (np. *Goblin #1*, *Goblin #2*), losuje dla nich rzuty na inicjatywę z modyfikatorem Zręczności (D20 + DEX mod), dopisuje do kolejki i przełącza widok do walki.
    * **Edytor i Wyszukiwarka Bestiariusza:** tworzenie i edycja zestawów, filtrowanie potworów po nazwie oraz klasie pancerza / CR (wszystkie, 0–1, 2–4, 5+), stepper liczebności potworów.
    * **Kalkulator Trudności DMG na Żywo:** interaktywny licznik trudności potyczki (*Trywialna*, *Łatwa*, *Średnia*, *Trudna*, *Śmiertelna*) obliczany na żywo na podstawie sumy XP przeciwników, mnożnika liczebności potworów i progów doświadczenia aktywnej drużyny graczy.
    * Zapis asynchroniczny (`POST /api/sessions/[id]/encounters` i `PUT /api/encounters/[id]`) oraz opcja natychmiastowego zapisu i przejścia do walki (*"Zapisz i Załaduj do Walki"*).
* **Testowanie:**
  * [`src/components/encounters/EncounterBuilder.test.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/encounters/EncounterBuilder.test.tsx): testy RTL renderowania podsumowania drużyny, ładowania zapisanych potyczek, kalkulacji trudności na żywo i zapisu potyczki.
  * [`src/components/dashboard/GmDashboard.test.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/dashboard/GmDashboard.test.tsx): test przełączania widoku środkowej kolumny do Encounter Buildera i powrotu do trackera walki.
  * [`e2e/initiative.spec.ts`](file:///Users/lukaszkosobucki/Documents/table-ops/e2e/initiative.spec.ts): test E2E Playwright weryfikujący nawigację do kreatora potyczek i powrót na żywej aplikacji.
  * Wszystkie 183 testy jednostkowe Vitest (100% zielone), 0 błędów Biome, build Turbopack oraz 10/10 testów Playwright E2E zielone.

---

## FAZA 5: Aktywna Potyczka (Combat Tracker & Cykl Tur)
*User Stories:* [`user-stories-and-spec/user_stories_aktywna_walka_i_tracker_tur.md`](file:///Users/lukaszkosobucki/Documents/table-ops/user-stories-and-spec/user_stories_aktywna_walka_i_tracker_tur.md)  
*API Spec:* [`user-stories-and-spec/wymagania_crud_api.md`](file:///Users/lukaszkosobucki/Documents/table-ops/user-stories-and-spec/wymagania_crud_api.md) (Sekcja 4)

### Chunk 5.1: Backend – Maszyna Stanu Walki i Endpointy Akcji (✅ Zakończone)
* **Backend:**
  * Domena [`src/lib/combat.ts`](file:///Users/lukaszkosobucki/Documents/table-ops/src/lib/combat.ts):
    * `startCombat`: utworzenie instancji walki, walidacja sesji, posortowanie uczestników wg inicjatywy (`initiative DESC`), przypisanie kolejności (`order: 0, 1, 2...`) i utworzenie wpisu w logach sesji.
    * `nextTurn`: maszyna cyklu tur – inkrementacja `currentTurnIndex`, przejście do nowej rundy (`currentRound + 1`) przy końcu kolejki, automatyczne dekrementowanie czasu trwania aktywnych statusów (`durationTurns - 1`) i usuwanie wygasłych (`durationTurns <= 0`), generowanie wpisu w historii sesji (`COMBAT_ACTION`).
    * `addCombatantToCombat`: dynamiczne dodanie uczestnika w trakcie walki (posiłki).
    * `applyStatusToCombatant` i `removeStatusFromCombatant`: nakładanie statusów czasowych z czasem trwania w turach oraz ich usuwanie.
    * `updateCombatantHp`: modyfikacja HP uczestnika z ograniczeniem do przedziału `0` do `maxHp`.
    * `endCombat`: zakończenie walki (`status: FINISHED`, `endedAt`), automatyczna synchronizacja odniesionych obrażeń bohaterów graczy do głównej tabeli `characters` i utworzenie wpisu `COMBAT_END`.
  * REST Route Handlers:
    * `POST /api/combat/start`: rozpoczęcie nowej walki.
    * `GET /api/combat/[id]`: pobranie stanu walki ze złączonymi uczestnikami, statusami, potworami i postaciami.
    * `POST /api/combat/[id]/next-turn`: przejście do kolejnej tury.
    * `POST /api/combat/[id]/combatants`: dodanie uczestnika do walki.
    * `PATCH /api/combat/[id]/combatants/[combatantId]`: aktualizacja HP uczestnika.
    * `POST /api/combat/[id]/combatants/[combatantId]/status`: nałożenie statusu.
    * `DELETE /api/combat/[id]/combatants/[combatantId]/status/[statusId]`: usunięcie statusu.
    * `POST /api/combat/[id]/end`: zakończenie walki i synchronizacja postaci.
* **Testowanie:**
  * [`src/lib/combat.test.ts`](file:///Users/lukaszkosobucki/Documents/table-ops/src/lib/combat.test.ts): 11 testów jednostkowych maszyny stanu walki, cyklu tur, wygasania statusów, dynamicznych posiłków i synchronizacji HP.
  * [`src/app/api/combat/combat-api.test.ts`](file:///Users/lukaszkosobucki/Documents/table-ops/src/app/api/combat/combat-api.test.ts): 10 testów integracyjnych endpointów REST.
  * Wszystkie 204 testy jednostkowe Vitest (100% zielone), 0 błędów Biome, czysty build Turbopack oraz 10/10 testów Playwright E2E zielone.

### Chunk 5.2: Frontend – Interfejs Śledzenia Walki (Combat View) (✅ Zakończone)
* **Frontend ([`src/components/initiative/`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/initiative/)):**
  * Ewolucja modułu inicjatywy w pełny system walki z maszynami 3 faz:
  * **Krok 1 (Faza PREPARING):**
    * Wybór grupy potyczkowej lub ręczne dodanie potworów i bohaterów (`AddCombatantsPanel`).
    * Przycisk *"Losuj Inicjatywę Potworów"* (D20 + DEX mod) oraz pola do wpisania ręcznego dla każdego uczestnika (gdy gracze rzucają fizycznymi kośćmi przy stole).
    * Wyróżniony przycisk **"⚔️ Rozpocznij Walkę"** (`data-testid="start-combat-btn"`), który sortuje kolejkę, zamraża edycję i rozpoczyna cykl tur (wraz z opcjonalną synchronizacją `POST /api/combat/start`).
  * **Krok 2 (Faza ACTIVE):**
    * Wyraźny wskaźnik aktywnej tury: złote świecące obramowanie karty, boczny znacznik oraz pulsujący badge `⚔️ TERAZ TURA`, informacja w nagłówku *"Kto teraz"* i *"Kto następny"*.
    * Przycisk **"Następna Tura ➔"** (`data-testid="next-turn-btn"`) i licznik rund (*"Runda 1"*, *"Runda 2"...*).
    * Przy przejściu tury automatyczne dekrementowanie czasu trwania aktywnych statusów (`durationTurns - 1`) i usuwanie wygasłych (`durationTurns <= 0`).
    * Szybkie kontrolki HP: przyciski obrażeń (`-1`, `-5`, `-10`), leczenia (`+1`, `+5`, `+10`) oraz dedykowany input wartości własnych (*Obrażenia* / *Leczenie*).
    * Zarządzanie statusami: modal/popover nakładania statusów D&D 5e z precyzyjnym czasem trwania (1, 2, 3, 5 tur), bąbelki statusów z licznikiem pozostałych tur obok punktów życia i przyciskiem natychmiastowego zdjęcia.
    * Widget **"Kronika Walki"** ([`CombatLogWidget.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/initiative/CombatLogWidget.tsx)) na bieżąco rejestrujący zdarzenia tur, obrażenia, leczenie i zmiany statusów.
    * **Ładowanie Drużyny i Postaci do Walki (Hurtowo i Pojedynczo):**
      * Przycisk *"Załaduj Drużynę do Walki"* w nagłówku panelu postaci ([`PartySidebar.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/dashboard/PartySidebar.tsx)) oraz w pustym stanie trackera walki ([`InitiativeTracker.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/initiative/InitiativeTracker.tsx)) z dynamicznym licznikiem liczebności drużyny.
      * Przyciski *"Do walki"* na pojedynczych kartach bohaterów i NPC w lewej kolumnie oraz *"Dodaj do Walki"* w karcie inspekcji postaci ([`CharacterInspectionCard.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/dashboard/CharacterInspectionCard.tsx)).
      * Zabezpieczenie przed duplikowaniem uczestników oraz etykiety i odznaki stanu *"W walce"*.
      * Pełna synchronizacja: postacie zachowują powiązanie `characterId`, a przy aktywnej potyczce są rejestrowane przez API (`POST /api/combat/[id]/combatants`), a po zakończeniu walki (`endCombat`) ich punkty życia są trwale zapisywane w PostgreSQL.
  * **Krok 3 (Faza FINISHED):**
    * Przycisk **"Zakończ Walkę"** (`data-testid="end-combat-btn"`), estetyczny baner podsumowania walki z liczbą rund oraz opcja rozpoczęcia nowego starcia (*"Nowe Starcie"*).
    * Automatyczna synchronizacja aktualnego stanu HP bohaterów do lewej kolumny kokpitu GM-a (`onCombatEnd`).
* **Testowanie:**
  * [`src/lib/combat.test.ts`](file:///Users/lukaszkosobucki/Documents/table-ops/src/lib/combat.test.ts): 12 testów jednostkowych (w tym test autorytatywnej synchronizacji `heroUpdates` przy zakończeniu walki).
  * [`src/components/initiative/CombatantCard.test.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/initiative/CombatantCard.test.tsx): 7 testów jednostkowych (renderowanie, aktywny badge `TERAZ TURA`, przyciski szybkiego HP, obrażenia i leczenie z inputa, wybór czasu trwania statusu, usuwanie statusu i edycja inicjatywy w fazie PREPARING).
  * [`src/components/initiative/InitiativeTracker.test.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/initiative/InitiativeTracker.test.tsx): 8 testów jednostkowych (cykl tur, inkrementacja rund, dekrementacja i wygasanie statusów, przejścia faz, synchronizacja HP, brak duplikatów wpisów w kronice walki, przycisk ładowania drużyny).
  * [`src/components/initiative/TurnControls.test.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/initiative/TurnControls.test.tsx): 3 testy jednostkowe kontrolek tur.
  * [`src/components/dashboard/PartySidebar.test.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/dashboard/PartySidebar.test.tsx): 7 testów jednostkowych (renderowanie drużyny/NPC, przycisk ładowania drużyny, dodawanie pojedynczych postaci, odznaki "W walce").
  * [`src/components/dashboard/CharacterInspectionCard.test.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/dashboard/CharacterInspectionCard.test.tsx): 7 testów jednostkowych (zarządzanie HP, sloty czarów, rzuty d20 oraz dodawanie do walki z inspekcji).
  * [`src/components/dashboard/GmDashboard.test.tsx`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/dashboard/GmDashboard.test.tsx): 7 testów integracyjnych (layout 3 kolumn, orkiestracja walki, hurtowe dodawanie drużyny, dodawanie postaci, synchronizacja).
  * [`e2e/initiative.spec.ts`](file:///Users/lukaszkosobucki/Documents/table-ops/e2e/initiative.spec.ts): 7 testów E2E Playwright sprawdzających pełny cykl życia walki na żywej aplikacji, ładowanie drużyny i pojedynczych postaci/NPC, szybkie klikanie obrażeń z natychmiastowym zakończeniem walki (debounced & authoritative sync), trwałość stanu (rundy, tury, HP, statusy) w bazie PostgreSQL po odświeżeniu strony (F5) oraz prawidłowe zamknięcie i powrót do fazy PREPARING po zakończeniu walki.
  * Pełna integracja trwałości cyklu życia potyczki:
    * Sesja bez aktywnej potyczki startuje w fazie `PREPARING` z widocznym przyciskiem *"Rozpocznij Walkę"*.
    * Kliknięcie *"Rozpocznij Walkę"* tworzy rekord w PostgreSQL (`POST /api/combat/start`), pobiera UUID-y uczestników i przechodzi do fazy `ACTIVE`.
    * Kolejne akcje (przejścia tur `next-turn`, zmiany HP z debouncingiem 500ms i wartościami bezwzględnymi `PATCH`, statusy, posiłki) są trwale i bezpiecznie zapisywane w PostgreSQL bez zalewania bazy i bez race conditions.
    * Odświeżenie strony (F5) odtwarza dokładny stan potyczki, rundę i tury bez utraty danych.
    * Kliknięcie *"Zakończ Walkę"* zamyka walkę w PostgreSQL (`status: FINISHED`), autorytatywnie przekazuje finalny stan HP bohaterów (`heroUpdates`), synchronizuje punkty życia postaci w PostgreSQL i przywraca stan przygotowania.
  * Wszystkie 227 testów jednostkowych Vitest (100% zielone, 27 plików), 0 błędów Biome linter (135 plików), czysty build Turbopack oraz 14/14 testów Playwright E2E zielone (100%).

---

## FAZA 6: Autentykacja i Konta Użytkowników (Supabase Auth & Multi-Tenancy)
*User Stories:* [`user-stories-and-spec/user_stories_autentykacja_i_konta.md`](file:///Users/lukaszkosobucki/Documents/table-ops/user-stories-and-spec/user_stories_autentykacja_i_konta.md)  
*API Spec:* Supabase Auth / Next.js Server Actions & Route Handlers

### Chunk 6.1: Backend & Schema – Integracja Supabase Auth i Izolacja Danych Sesji
* **Backend & Baza Danych:**
  * Rozszerzenie modelu Prisma `Session` o pole `userId String? @map("user_id")` z indeksem.
  * Helpery / middleware autoryzacyjny z użyciem `@supabase/ssr` weryfikujące token JWT użytkownika w żądaniach API.
  * Ograniczenie zapytań `getSessions()` oraz mutacji wyłącznie do aktywnego `userId` (izolacja sesji per konto).
  * Zapewnienie kompatybilności dla sesji `test` / trybu developerskiego i gościa.
* **Testowanie:**
  * Testy integracyjne izolacji: weryfikacja, że użytkownik A nie widzi ani nie może edytować sesji użytkownika B.

### Chunk 6.2: Frontend – Logowanie, Rejestracja i Google OAuth
* **Frontend ([`src/components/auth/`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/auth/)):**
  * Estetyczny ekran logowania i rejestracji zgodny z dark fantasy design tokens.
  * Formularz rejestracji oraz logowania loginem (e-mail) i hasłem z walidacją i komunikatami błędów.
  * Przycisk **"Zaloguj przez Google"** (Google OAuth przez Supabase Auth provider).
  * Pasek nawigacyjny: wskaźnik profilu (avatar / e-mail) oraz przycisk wylogowania.
  * Przekierowanie po pomyślnym logowaniu do widoku własnych sesji.
* **Testowanie:**
  * Testy jednostkowe widoków autoryzacji: weryfikacja obsługi błędów niepoprawnych danych logowania oraz przekierowania po sukcesie.

---

## FAZA 7: Oś Czasu, Historia i System Odpoczynków
*User Stories:* [`user-stories-and-spec/user_stories_modu_historii.md`](file:///Users/lukaszkosobucki/Documents/table-ops/user-stories-and-spec/user_stories_modu_historii.md)  
*API Spec:* [`user-stories-and-spec/wymagania_crud_api.md`](file:///Users/lukaszkosobucki/Documents/table-ops/user-stories-and-spec/wymagania_crud_api.md) (Sekcja 5)

### Chunk 7.1: Backend – Obsługa Logów i Automatyka Odpoczynków
* **Backend:**
  * `GET /api/sessions/[id]/logs` – pobieranie chronologicznej listy zdarzeń sesji.
  * `POST /api/sessions/[id]/logs` – dodanie zdarzenia:
    * Typ `REST_SHORT`: dodanie wpisu oraz opcjonalne wydanie Kości Wytrzymałości (Hit Dice).
    * Typ `REST_LONG`: automatyczna regeneracja tabeli `characters` dla wszystkich bohaterów sesji (przywrócenie `currentHp = maxHp`, zresetowanie zużytych slotów czarów `used: 0`), wygenerowanie podsumowującego wpisu na osi czasu.
    * Typ `SPELL_CAST` / `CUSTOM_NOTE`: rejestracja użycia czaru lub notatki narracyjnej GM-a.
  * `GET /api/combat/[combat_id]/logs` – pobranie szczegółowego logu aktywnej lub zakończonej potyczki.
* **Testowanie:**
  * Wywołanie `POST /api/sessions/[id]/logs` z typem `REST_LONG` dla postaci z 5/20 HP – sprawdzenie, czy w bazie postać ma natychmiast 20/20 HP oraz odnowione sloty.

### Chunk 7.2: Frontend – Interaktywna Oś Czasu i Modale Odpoczynków
* **Frontend:**
  * Rozbudowa Prawej Kolumny Dashboardu:
    * Wizualny timeline ze wskaźnikami godzinowymi (`18:42`, `19:15`).
    * Filtrowanie zdarzeń: "Wszystko", "Tylko walki", "Odpoczynki", "Zaklęcia i akcje".
    * Modal "Krótki Odpoczynek (1 godzina)" z wyborem postaci.
    * Modal "Długi Odpoczynek (8 godzin)" z podsumowaniem zregenerowanych HP i slotów czarów.
    * Przycisk dodania szybkiej notatki fabularnej (np. "Drużyna dotarła do karczmy Pod Rozbrykanym Kucykiem").
  * Obsługa widoku podsumowania zdarzenia w Środkowej Kolumnie po kliknięciu wpisu z Osi Czasu.
* **Testowanie:**
  * Przetestowanie wykonania Długiego Odpoczynku w UI – sprawdzenie animacji i odświeżenia pasków życia bohaterów w Lewej Kolumnie.

---

## FAZA 8: Rozbudowa Kompendium (Zaklęcia, Przedmioty i Integracja)
*Specyfikacja:* [`user-stories-and-spec/specyfikacja_aplikacji_rpg_tracker.md`](file:///Users/lukaszkosobucki/Documents/table-ops/user-stories-and-spec/specyfikacja_aplikacji_rpg_tracker.md) (Sekcja 1)  
*API Spec:* [`user-stories-and-spec/wymagania_crud_api.md`](file:///Users/lukaszkosobucki/Documents/table-ops/user-stories-and-spec/wymagania_crud_api.md) (Sekcja 6)

### Chunk 8.1: Backend – Seed i API Zaklęć oraz Przedmiotów
* **Backend:**
  * Skrypt seedujący / wrapper dla D&D 5e SRD API (podobnie jak dla potworów):
    * `GET /api/compendium/spells?search=...&level=...&school=...`
    * `GET /api/compendium/items?search=...&type=...`
    * `GET /api/compendium/monsters?search=...` (zintegrowany z istniejącym [`src/lib/monsters.ts`](file:///Users/lukaszkosobucki/Documents/table-ops/src/lib/monsters.ts)).
  * Lokalne pliki seed JSON (`prisma/spells_seed.json`, `prisma/items_seed.json`) dla bezbłędnego działania offline.
* **Testowanie:**
  * Weryfikacja endpointów kompendium, poprawności filtrów i czasów odpowiedzi poniżej 50ms w trybie offline/cache.

### Chunk 8.2: Frontend – Przeglądarka Kompendium i Dodawanie do Karty
* **Frontend ([`src/components/bestiary/`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/bestiary/)):**
  * Rozszerzenie modułu kompendium w pełne narzędzie D&D 5e:
    * Zakładki: Bestiariusz, Zaklęcia (Spells), Ekwipunek (Items).
    * Karty zaklęć: poziom, szkoła magii, czas rzucania, zasięg, komponenty, opis.
    * Akcja: **"+ Dodaj do postaci"** – pozwala z poziomu karty czaru/przedmiotu przypisać go od razu wybranemu bohaterowi sesji.
* **Testowanie:**
  * Wyszukanie czaru "Cure Wounds", przypisanie go do postaci Kleryka, otwarcie karty Kleryka w Dashboardzie i weryfikacja obecności czaru w jego liście.

---

## FAZA 9: Integracja Real-time (Kości), Testy E2E, Narzędzia Jakości i CI

### Chunk 9.1: Narzędzia Rzutów Kośćmi w Kokpicie GM-a
* **Frontend ([`src/components/dice/`](file:///Users/lukaszkosobucki/Documents/table-ops/src/components/dice/)):**
  * Integracja symulatora kości z akcjami w Dashboardzie:
    * Kliknięcie atrybutu postaci (np. `STR 16 (+3)`) w karcie środkowej kolumny wykonuje rzut D20 + modyfikator w podręcznym rollerze.
    * Opcja "Wyślij wynik rzutu do Osi Czasu Sesji".
* **Testowanie:**
  * Wykonanie rzutu z poziomu karty postaci – weryfikacja poprawności obliczenia modyfikatora i dodania wpisu do historii.

### Chunk 9.2: Zestaw Testów E2E & Unit Testów (Playwright & Vitest)
* **Zestaw Testów:**
  * **Testy jednostkowe (Vitest):** reguły D&D, logika rzutów kośćmi, wyliczanie inicjatywy, formatowanie modyfikatorów i komponenty UI.
  * **Testy E2E (Playwright):**
    1. Nawigacja aplikacji i przełączanie zakładek kokpitu.
    2. Moduł Bestiariusza (wyszukiwanie, modal szczegółów, klonowanie homebrew).
    3. Kreator postaci (przejście kroków, generowanie karty postaci).
    4. Tracker inicjatywy (zarządzanie kolejką, kontrola rund i tur).
    5. Symulator kości (zmiana modyfikatorów, rzuty i historia).

### Chunk 9.3: Narzędzia Jakości Kodu (Biome.js) & Pipeline CI ([`.github/workflows/ci.yml`](file:///Users/lukaszkosobucki/Documents/table-ops/.github/workflows/ci.yml))
* **Biome.js (`@biomejs/biome`):**
  * Zunifikowany linter i formatter zastępujący ESLint i Prettier.
  * 0 podatności bezpieczeństwa w `npm audit`.
  * Konfiguracja [`biome.json`](file:///Users/lukaszkosobucki/Documents/table-ops/biome.json) z dyrektywami Tailwind v4 (`css.parser.tailwindDirectives: true`) oraz automatycznym sortowaniem importów.
* **Pipeline GitHub Actions (`ci.yml`):**
  * **Job `lint-and-build`:** `npm run lint` + `npm run build` (Turbopack + TypeScript).
  * **Job `unit-tests`:** `npm run test:coverage` (Vitest).
  * **Job `e2e-tests`:** `npm run test:e2e` (Playwright).

---

## 📋 Matryca Zależności Zadań

| Etap | Zadanie | Zależności | Czas realizacji (orientacyjny) |
| :--- | :--- | :--- | :--- |
| **Krok 0** | Aktualizacja schematu Prisma (`schema.prisma`) pod Supabase (PostgreSQL) | *Brak* | 1 chunk |
| **Faza 1** | Backend CRUD Sesji + UI Wyboru Sesji | Krok 0 | 2 chunki |
| **Faza 2** | Full-state API + 3-Kolumnowy Dashboard | Faza 1 | 2 chunki |
| **Faza 3** | CRUD Postaci + Kreator z automatyką slotów czarów | Faza 2 | 2 chunki |
| **Faza 4** | Grupy Potyczkowe (Encounter Builder) | Faza 3 | 2 chunki |
| **Faza 5** | Combat Tracker (Maszyna stanów, tury, statusy, HP) | Faza 4 | 2 chunki |
| **Faza 6** | Autentykacja (Login/Hasło + Google OAuth) i Izolacja Sesji | Faza 5 | 2 chunki |
| **Faza 7** | Oś Czasu, Historia i System Odpoczynków | Faza 6 | 2 chunki |
| **Faza 8** | Kompendium (Zaklęcia, Przedmioty, seed offline) | Faza 3 | 2 chunki |
| **Faza 9** | Integracja rzutów kośćmi, weryfikacja E2E & CI | Faza 1-8 | 3 chunki |