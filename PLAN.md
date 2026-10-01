# Plan Projektu: Aplikacja dla Mistrza Gry (RPG/D&D)

## 1. Założenia Główne i Technologia
- **Technologia:** Next.js (App Router), TypeScript, React, Tailwind CSS. Wykorzystanie pełnego potencjału Next.js jako środowiska fullstackowego.
- **Baza danych:** PostgreSQL (sugerowane zarządzanie przez Prisma ORM lub Drizzle).
- **Architektura pod kątem przyszłości:** API zorganizowane tak, aby łatwo było w przyszłości zintegrować WebSockety (np. poprzez Socket.io lub usługi takie jak Pusher/Ably), co będzie kluczowe przy wprowadzaniu trybu online dla graczy, pozwalającego na rzuty kośćmi i aktualizacje HP w czasie rzeczywistym.

## 2. Dlaczego PostgreSQL?
Bazy relacyjne (SQL) są idealne dla struktury danych systemów takich jak D&D. 
W RPG mamy do czynienia z wieloma mocnymi relacjami:
- Postać należy do Użytkownika i do Kampanii.
- Klasa posiada konkretne Umiejętności.
- Ekwipunek to relacja wiele-do-wielu (Postać posiada wiele Przedmiotów).
PostgreSQL posiada również potężne wsparcie dla typu `JSONB`. Pozwala to na elastyczne definiowanie atrybutów "customowych" i homebrew, dając korzyści znane z baz NoSQL (jak MongoDB) przy zachowaniu ścisłych relacji.

## 3. Skąd pozyskać dane (Zasady, Przeciwnicy, Przedmioty)?
Zasilenie bazy wszystkimi encjami D&D 5e to ogromne wyzwanie, ale system SRD (System Reference Document) jest dostępny za darmo (na licencji OGL lub Creative Commons).

**Zalecane źródła:**
1. **D&D 5e API (`dnd5eapi.co`)**: Jedno z najlepszych, darmowych API zawierających potwory, zaklęcia, klasy i rasy ze standardowego SRD. Zwraca czysty JSON.
2. **Open5e API**: Posiada jeszcze bogatsze zasoby, często integrując materiały od innych wydawców (np. Kobold Press).

**Strategia implementacji:**
Nie należy odpytywać tych API "w locie" podczas gry. Najlepszym podejściem będzie przygotowanie **skryptu seedującego** w Node.js, który w fazie dewelopmentu:
1. Pobierze wszystkie encje z API.
2. Zmapuje je na Twój schemat Prisma/PostgreSQL.
3. Zapisze je fizycznie w Twojej bazie danych.
Dzięki temu operacje wyszukiwania (filtrowanie potworów np. po CR - Challenge Rating) będą błyskawiczne, a Ty pozwolisz Mistrzom Gry na swobodną edycję (np. podbicie HP wylosowanemu z bazy Goblinowi).

## 4. Architektura Modułów (Zestawienie Funkcjonalności)

### A. Kompendium i Zarządzanie Danymi (Zasilane z API)
- Wewnętrzna wyszukiwarka Bestiariusza, Zaklęć i Przedmiotów.
- Klonowanie i modyfikowanie (Homebrew): Mistrz Gry musi mieć opcję wzięcia standardowego potwora, zmodyfikowania jego statystyk i zapisania jako unikalnej wersji do swojej kampanii.

### B. Moduł Tworzenia Postaci z poziomu GM-a
- **Kreator wieloetapowy (Wizard):** Wybór Rasy -> Klasy -> Przypisanie Atrybutów (Point Buy / Rzuty) -> Wybór Biegłości (Proficiencies) -> Ekwipunek.
- **Karta Postaci (Sheet):** Generowanie wirtualnej karty, która automatycznie przelicza modyfikatory cech, klasę pancerza (AC) i bazowy atak.
- Posiadanie wszystkich postaci pod jednym dachem pozwala GM-owi na bieżąco kontrolować tzw. "Pasywną Percepcję" (Passive Perception) graczy bez konieczności pytania ich o nią na sesji.

### C. Ekran Prowadzenia Sesji (Game Master Dashboard)
- **Initiative Tracker (Narzędzie Walki):**
  - Dodawanie postaci graczy i przeciwników z Bestiariusza do potyczki.
  - Generowanie rzutów na inicjatywę dla potworów jednym kliknięciem.
  - Śledzenie HP przeciwników i nakładanie stanów (Conditions) np. *Poisoned*, *Prone*.
- **Zarządzanie Kampanią:** 
  - Notatki przypięte do sesji.
  - Tablice z lokalizacjami i NPC.

## 5. Zarys bazy danych (Przykład encji)
- `User` (Konto gracza lub MG)
- `Campaign` (Kampania zarządzana przez Usera)
- `Character` (Karta postaci gracza)
- `Monster` (Baza szablonów przeciwników ze skryptu)
- `Encounter` (Instancja konkretnej walki)
- `EncounterCombatant` (Zarządzanie pozycją w inicjatywie oraz aktualnym HP konkretnego goblina lub gracza)

## 6. Proponowane kroki startowe
1. Zainicjalizowanie repozytorium Next.js w strukturze monorepo (np. z użyciem narzędzi, które lubisz, podział na pakiety frontend/backend, jeśli uznasz to za potrzebne).
2. Konfiguracja bazy danych PostgreSQL.
3. Napisanie skryptu "Data Fetcher" łączącego się z *D&D 5e API* w celu zasilenia bazy encjami klas i potworów.
4. Zbudowanie widoku przeglądania Bestiariusza.
5. Zaprojektowanie kreatora postaci na frontendzie połączonego z zapisanymi w bazie danymi.