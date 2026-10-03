# Specyfikacja Aplikacji - Game Master Tracker (D&D 5e)

Dokument zawiera zbiór wymagań funkcjonalnych dla aplikacji full-stack służącej do prowadzenia sesji RPG. Na ten moment aplikacja jest ściśle zintegrowana z mechaniką D&D 5e, ale jej architektura zakłada w przyszłości możliwość rozszerzenia o inne systemy.

## 1. Architektura i Kompendium

* **Backend jako Źródło Prawdy:** Całe "Kompendium" (zaklęcia, przedmioty, bestiariusz, umiejętności) jest serwowane przez dedykowany backend.
* **Źródło Danych:** Backend stanowi kopię/wrapper darmowego API D&D 5e (np. z GitHub), dostarczając predefiniowane dane do globalnej wyszukiwarki.
* **Rozszerzalność:** Możliwość przyszłego dodawania własnych elementów dombrew do bazy.

## 2. Ekran Startowy (Zarządzanie Sesjami)

* **Lista Sesji:** Widok kafelkowy lub listowy prezentujący wszystkie utworzone sesje.
* **Nowa Sesja:** Wyraźny przycisk "Plus" na końcu listy, otwierający modal do podania nazwy nowej sesji.
* **Akcje na Sesji:**
  * Przycisk edycji (zmiana nazwy).
  * Przycisk usunięcia sesji (z potwierdzeniem).
* **Wejście do Sesji:** Kliknięcie w kafelek sesji otwiera **Główny Panel Sesji (Dashboard)** ładując jej cały, aktualny stan.

## 3. Główny Panel Sesji (Dashboard) - NOWOŚĆ

Centrum dowodzenia Mistrza Gry po wejściu do sesji. Ekran oparty na elastycznym, trzykolumnowym układzie:

* **Lewa Kolumna (Lista Uczestników):**
  * Skrócona lista wszystkich Bohaterów Graczy i ważnych NPC biorących udział w sesji.
  * **Wizualny status życia:** Kropka obok avatara/imienia (Zielona = żyje, Czerwona/Czaszka = HP spadło do 0 / nie żyje).
  * Kliknięcie postaci zmienia zawartość Środkowej Kolumny.
* **Prawa Kolumna (Oś Czasu / Logi):**
  * Historia działań drużyny z sygnaturami czasowymi (np. odpoczynki, zakończone walki, użyte zaklęcia).
  * Kliknięcie logu zmienia zawartość Środkowej Kolumny.
* **Środkowa Kolumna (Widok Detali - Viewport):**
  * Dynamiczny obszar, w którym wyświetlają się szczegóły elementu wybranego z lewej lub prawej kolumny.
  * **Tryb Postaci:** Szybki podgląd do odgrywania (LARPowania) - pokazuje cechy charakteru, wygląd, motywacje, ekwipunek i skrócone statystyki.
  * **Tryb Historii:** Podsumowanie wybranego wydarzenia (np. pełne statystyki zakończonej walki: kto ile obrażeń przyjął, czas trwania).

## 4. Kreator i Zarządzanie Postaciami (Bohaterowie i NPC)

Osobna zakładka z pełnym kreatorem.

* **Karta Bohatera (Kreator):**
  * *Pola obowiązkowe:* Statystyki, Umiejętności (Skills), Biegłości (Proficiencies), min. 1 Cecha charakteru.
  * *Pola opcjonalne:* Przedmioty, Dodatkowe umiejętności.
  * *Zaklęcia:* Obsługa slotów czarów bazująca na klasie i poziomie postaci (Sztuczki / Cantripy posiadają nieskończoną liczbę użyć, reszta to odklikiwane sloty).

## 5. Grupy Potyczkowe (Encounter Builder)

* **Przygotowanie Walk:** Możliwość tworzenia i zapisywania grup przeciwników z wyprzedzeniem.
* **Zarządzanie Drużyną:** Możliwość tworzenia stałych grup bohaterów.

## 6. Aktywna Potyczka (Combat Tracker)

* **Dodawanie Uczestników:** Z Bestiariusza, Grup Potyczkowych lub listy NPC/Bohaterów sesji.
* **Inicjatywa i Start Walki:** Losowanie auto/pół-auto/manualne z obowiązkowym zatwierdzeniem przyciskiem "Rozpocznij Walkę".
* **Zarządzanie Stanem Podczas Walki:**
  * Oś czasu/Kolejka (Kto aktualnie wykonuje turę).
  * Edycja HP (zadawanie obrażeń / leczenie).
  * **Statusy:** Rozbudowane efekty ze zintegrowanym *odliczaniem tur*.
* **Combat Log (Historia Akcji):** Rejestrowanie akcji w walce (kto otrzymał obrażenia, kto dostał status).
* **Zakończenie Walki (Autozapis):** Zapis aktualnego HP i zużytych zasobów bohaterów, wypchnięcie logu na Prawą Kolumnę Dashboardu.