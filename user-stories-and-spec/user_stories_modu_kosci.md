# User Stories: Podręczny Rzutnik Kości (Dice Tray & Roller)

Dokument opisuje wymagania użytkownika dotyczące modułu podręcznego rzutnika kości w kokpicie Mistrza Gry.

---

## 1. Dostęp i Pływające Okno Rzutnika (Draggable Floating Window)

**Jako** Mistrz Gry (GM)  
**Chcę** mieć łatwo dostępny przycisk w prawym górnym rogu nagłówka sesji oraz globalny skrót klawiszowy `D` otwierający pływające, przeciągalne okno rzutnika kości  
**Aby** móc w dowolnym momencie walki lub narracji wykonać rzut bez opuszczania aktualnego widoku i bez zasłaniania kluczowych danych potyczki.

### Kryteria Akceptacji:
- W prawym górnym rogu nagłówka sesji znajduje się stały przycisk akcji z ikoną kości oraz etykietą tekstową.
- Wciśnięcie przycisku lub skrótu klawiszowego `D` przełącza widoczność okna (toggle open/close), chyba że aktywny jest focus w polu edycji tekstu (`input`/`textarea`).
- Okno posiada nagłówek z uchwytem przeciągania (*drag handle*), umożliwiający przesuwanie w granicach obszaru roboczego ekranu (`bounds: "window"` / viewport clamping).
- Pozycja okna (`x`, `y`) oraz stan minimalizacji są zapamiętywane w pamięci podręcznej przeglądarki (`localStorage`), dzięki czemu kolejne otwarcie zachowuje położenie wybrane przez Mistrza Gry.
- Okno można zminimalizować do paska dokowania, zamknąć klawiszem `Esc` lub przyciskiem `X`.
- Na ekranach o szerokości poniżej 1024px rzutnik płynnie adaptuje się jako wyśrodkowany arkusz dolny (`bottom-sheet`) lub modal.

---

## 2. Konfiguracja Puli Kości, Modyfikatorów i Mechaniki D20

**Jako** Mistrz Gry  
**Chcę** w prosty sposób kliknięciami skompletować mieszaną pulę kości (np. 4k6 + 2k10 + 1k20) oraz dodać modyfikator numeryczny  
**Aby** sprawnie odwzorować dowolny test umiejętności, rzut obronny, obrażenia ataku lub tabelę losową z podręcznika RPG.

### Kryteria Akceptacji:
- Dostępny zestaw kości wielościennych: `d4`, `d6`, `d8`, `d10`, `d12`, `d20`, `d100`.
- Każda kość posiada stały, unikalny kolor zgodny z tokenami stylu:
  - `d4`: błękitny / cyjan (`#06b6d4`)
  - `d6`: zielony (`#22c55e`)
  - `d8`: fioletowy (`#a855f7`)
  - `d10`: żółty (`#eab308`)
  - `d12`: pomarańczowy (`#f97316`)
  - `d20`: czerwony / karmazynowy (`#ef4444`)
  - `d100`: grafitowy / stalowy (`#64748b`)
- Kliknięcie wybranej kości zwiększa licznik w buforze rzutu (np. `+1d6`).
- Dostępny jest przycisk zerowania bufora (`Wyczyść` / skrót `C`).
- Pole numeryczne pozwala zdefiniować modyfikator całkowity w zakresie od `-99` do `+99`.
- Przełącznik mechaniki dla rzutów k20: *Standard*, *Advantage* (ułatwienie / przewaga – wybór wyższej kości, niższa przekreślona), *Disadvantage* (utrudnienie / kara – wybór niższej kości, wyższa przekreślona).
- Kliknięcie atrybutu lub rzutu obronnego na karcie postaci w dashboardzie automatycznie otwiera rzutnik z pulą 1k20 i wyliczonym modyfikatorem cechy.

---

## 3. Fizyczna Symulacja 3D i Natychmiastowa Czytelność Wyniku

**Jako** Mistrz Gry  
**Chcę** widzieć fizyczną symulację turlających się kości 3D w oknie, ale jednocześnie natychmiast otrzymać sumaryczny wynik liczbowy  
**Aby** zachować immersję tradycyjnej sesji przy stole, nie tracąc dynamiki prowadzenia walki.

### Kryteria Akceptacji:
- Kliknięcie „Rzuć” (lub wciśnięcie klawisza `Enter`) wyzwala animację 3D na przezroczystej warstwie Canvas wewnątrz okna rzutnika.
- W nagłówku okna natychmiast wyświetla się podsumowanie sumaryczne oraz czytelne rozbicie na poszczególne kości (np. `Wynik: 34` | `4k6 [4, 6, 2, 5] + 2k10 [7, 6] + 4 = 34`).
- Wyniki losowane są kryptograficznie (`window.crypto.getRandomValues()`) przed rozpoczęciem animacji, stanowiąc deterministyczny cel fizyki.
- Kliknięcie w obszar symulacji natychmiast pomija animację (*skip*) i stabilizuje kości na ostatecznych wartościach.
- Biblioteka symulacji 3D jest ładowana leniwie (`lazy loading` / `dynamic import`), nie obciążając startowego bundle'a aplikacji.
- Dostępna jest opcja w ustawieniach: *„Wyłącz fizykę 3D (szybkie rzuty matematyczne)”*, a w razie braku akceleracji WebGL aplikacja przełącza się automatycznie w tryb lekki.

---

## 4. Rejestracja w Historii Sesji i Rzuty Ukryte (GM Secret Roll)

**Jako** Mistrz Gry  
**Chcę**, aby wynik każdego rzutu był automatycznie odnotowywany na Osi Czasu Sesji, z możliwością oznaczenia go jako „Rzut ukryty (GM Secret Roll)”  
**Aby** mieć pełną kronikę rzutów z sesji oraz móc wykonywać rzuty za zasłonką w tajemnicy przed graczami.

### Kryteria Akceptacji:
- Każdy rzut wysyła zdarzenie do Osi Czasu Sesji z dokładnym znacznikiem czasu, formułą i rozbiciem wartości.
- Dostępny jest przełącznik `Rzut ukryty (Secret Roll)`.
- Wpisy ukryte otrzymują wizualny znacznik „Tylko dla GM” i są wykluczone z publicznego feedu/widoku gracza.
- Rzutnik udostępnia podręczną historię ostatnich 20 rzutów z opcją ponownego wywołania danej formuły (`Reroll`).
