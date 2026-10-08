# User Stories: Dice Tray & Roller

Dokument opisuje wymagania użytkownika dotyczące podręcznego modułu rzutnika kości w panelu Mistrza Gry.

---

## US-01: Podręczny rzutnik kości dla Mistrza Gry

**Jako** Mistrz Gry (GM),  
**Chcę** mieć łatwo dostępny przycisk w prawym górnym rogu nagłówka sesji (oraz globalny skrót klawiszowy), otwierający pływające, przeciągalne okno rzutnika kości,  
**Aby** móc w dowolnym momencie walki lub narracji wykonać rzut bez opuszczania aktualnego widoku i bez zasłaniania kluczowych danych potyczki.

### Kryteria Akceptacji:
- [ ] W prawym górnym rogu nagłówka sesji znajduje się przycisk akcji z ikoną kości oraz etykietą tekstową.
- [ ] Naciśnięcie przycisku lub wciśnięcie klawisza `D` otwiera/zamyka okno rzutnika (*toggle*).
- [ ] Okno posiada nagłówek z uchwytem (*drag handle*), umożliwiający przesuwanie w granicach ekranu (`bounds: "window"`).
- [ ] Pozycja okna jest zapamiętywana w pamięci podręcznej sesji (`localStorage`), aby kolejne otwarcie zachowało wybraną lokalizację.
- [ ] Okno można zminimalizować do paska dokowania lub zamknąć klawiszem `Esc` albo przyciskiem `X`.

---

## US-02: Konfiguracja puli kości i modyfikatorów

**Jako** Mistrz Gry,  
**Chcę** w prosty sposób kliknięciami skompletować mieszaną pulę kości (np. 4k6 + 2k10 + 1k20) oraz dodać opcjonalny modyfikator liczbowy,  
**Aby** sprawnie odwzorować dowolny test umiejętności, obrażenia ataku lub rzut z podręcznika RPG.

### Kryteria Akceptacji:
- [ ] Dostępny zestaw kości: `d4`, `d6`, `d8`, `d10`, `d12`, `d20`, `d100`.
- [ ] Każda kość posiada stały, przypisany kolor:
  - `d4`: błękitny / cyjan (`#06b6d4`)
  - `d6`: zielony (`#22c55e`)
  - `d8`: fioletowy (`#a855f7`)
  - `d10`: żółty (`#eab308`)
  - `d12`: pomarańczowy (`#f97316`)
  - `d20`: czerwony / karmazynowy (`#ef4444`)
  - `d100`: grafitowy / stalowy (`#64748b`)
- [ ] Kliknięcie wybranej kości zwiększa licznik w buforze rzutu (np. `+1d6`).
- [ ] Dostępny przycisk zerowania bufora (`Clear`).
- [ ] Pole numeryczne pozwalające zdefiniować modyfikator (`+/- X` w zakresie -99 do +99).
- [ ] Przełącznik mechaniki dla k20: *Standard*, *Advantage* (ułatwienie), *Disadvantage* (utrudnienie).

---

## US-03: Fizyczna animacja 3D i natychmiastowa czytelność wyniku

**Jako** Mistrz Gry,  
**Chcę** widzieć fizyczną symulację turlających się kości wewnątrz okna, ale jednocześnie natychmiast otrzymać sumaryczny wynik liczbowy,  
**Aby** zachować immersję tradycyjnej sesji przy stole, nie tracąc dynamiki prowadzenia walki.

### Kryteria Akceptacji:
- [ ] Kliknięcie „Rzuć” generuje animację 3D na przezroczystej warstwie Canvas wewnątrz okna rzutnika.
- [ ] W nagłówku okna natychmiast wyświetla się podsumowanie sumaryczne oraz rozbicie na poszczególne kości:
  - Format: `Wynik: 34` | `4k6 [4, 6, 2, 5] + 2k10 [7, 6] + 4 = 34`.
- [ ] Kliknięcie w obszar symulacji natychmiast pomija animację (*skip*) i stabilizuje kości na ostatecznych wartościach.
- [ ] Dostępny przełącznik w ustawieniach: *„Wyłącz fizykę 3D (szybkie rzuty matematyczne)”*.

---

## US-04: Logowanie do Osi Czasu Sesji i rzuty ukryte

**Jako** Mistrz Gry,  
**Chcę**, aby wynik każdego rzutu był automatycznie odnotowywany w panelu „Oś Czasu Sesji”, z możliwością oznaczenia go jako „Rzut ukryty (GM Secret Roll)”,  
**Aby** mieć pełną historię przebiegu walki i zachować tajemnicę rzutów za zasłonką.

### Kryteria Akceptacji:
- [ ] Każdy wykonany rzut trafia do panelu Osi Czasu jako wpis z dokładnym znacznikiem czasu i rozbiciem wartości.
- [ ] Dostępny przełącznik `Rzut ukryty (Secret Roll)`.
- [ ] Wpisy ukryte otrzymują wizualny znacznik „Tylko dla GM” i są wykluczone z publicznego feedu/widoku gracza.
- [ ] Dostępna historia ostatnich 20 rzutów z możliwością ponownego rzucenia (`Reroll`).
