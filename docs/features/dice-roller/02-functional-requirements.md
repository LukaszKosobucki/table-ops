# Wymagania Funkcjonalne (FR) — Dice Tray & Roller

Dokument opisuje specyfikację logiki biznesowej i zachowania interfejsu modułu rzutnika kości.

---

### FR-01: Trigger i punkty wejścia
* **FR-01.1:** W prawym górnym wierszu panelu kontrolnego (nagłówek sesji) dostępny jest stale widoczny przycisk wywołania rzutnika.
* **FR-01.2:** Aplikacja rejestruje globalny nasłuchiwacz skrótu klawiszowego `D`, który przełącza widoczność okna (toggle open/close), chyba że aktywny jest focus w polu tekstowym `input`/`textarea`.

### FR-02: Pływający kontener okna (Draggable Modal)
* **FR-02.1:** Komponent renderuje się w warstwie wierzchniej (`position: fixed`, `z-index: 1000`).
* **FR-02.2:** Użytkownik może przesuwać okno poprzez chwycenie za pasek tytułowy (`drag handle`).
* **FR-02.3:** Granice przemieszczania są ograniczone do aktualnego obszaru roboczego okna przeglądarki (`viewport clamping`).
* **FR-02.4:** Stan pozycji (`x`, `y`) oraz stanu minimalizacji zapisywany jest w `localStorage` dla aktywnego profilu GM.

### FR-03: Formuła i buforowanie rzutów
* **FR-03.1:** Interfejs udostępnia kafelkowy selektor kości: `d4`, `d6`, `d8`, `d10`, `d12`, `d20`, `d100`.
* **FR-03.2:** Każde kliknięcie w kość inkrementuje liczbę danej kości w puli rzutu.
* **FR-03.3:** Moduł obsługuje modyfikator numeryczny będący liczbą całkowitą z zakresu od `-99` do `+99`.
* **FR-03.4:** Zapewniony jest przycisk `Reset / Wyczyść`, który przywraca pustą pulę kości.

### FR-04: Silnik wyliczeń i determinizm
* **FR-04.1:** Losowanie wartości opiera się na kryptograficznym generatorze `window.crypto.getRandomValues()`.
* **FR-04.2:** Wynik liczbowy generowany jest przed startem animacji i przekazywany jako deterministyczny cel do silnika symulacji fizycznej (ściana docelowa odpowiada wylosowanej liczbie).
* **FR-04.3:** Obsługa rzutów z Advantage/Disadvantage dla k20: generowane są dwa rzuty, a algorytm wybiera odpowiednio wartość wyższą lub niższą, oznaczając odrzuconą kość jako przekreśloną.

### FR-05: Warstwa symulacji fizycznej Canvas
* **FR-05.1:** Wnętrze okna rzutnika zawiera kontener `<canvas>` renderujący trójwymiarowe modele kości w przypisanych kolorach.
* **FR-05.2:** Kliknięcie w dowolne miejsce warstwy Canvas natychmiast wymusza zatrzymanie fizyki i prezentuje ostateczne ułożenie ścianek.

### FR-06: Integracja z Osią Czasu i Historia
* **FR-06.1:** Komponent wysyła zdarzenie do centralnego store'u notatek/osi czasu sesji po zakończeniu rzutu.
* **FR-06.2:** Tryb `GM Secret Roll` przypisuje do zdarzenia flagę `isSecret: true`, zabezpieczając wpis przed synchronizacją z potencjalnym widokiem graczy.
* **FR-06.3:** Rzutnik przechowuje listę ostatnich 20 rzutów z opcją ich ponownego wywołania (`Reroll`).
