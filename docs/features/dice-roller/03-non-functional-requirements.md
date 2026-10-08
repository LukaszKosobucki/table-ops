# Wymagania Niefunkcjonalne (NFR) — Dice Tray & Roller

Dokument określa kryteria wydajnościowe, architektoniczne, dostępnościowe oraz standardy integracji modułu rzutnika.

---

### NFR-01: Wydajność i stabilność klatek (Performance)
* Renderowanie fizyki kości 3D nie może powodować spadków poniżej **55 FPS** na referencyjnej konfiguracji przeglądarkowej w głównym wątku UI.
* W przypadku wykrycia środowiska bez wsparcia akceleracji sprzętowej WebGL lub przy obciążeniu CPU silnik musi automatycznie przełączyć się na tryb „Lekki” (pominięcie animacji 3D, natychmiastowe wyświetlenie wyniku numerycznego).

### NFR-02: Optymalizacja paczki (Bundle Size & Code Splitting)
* Moduł fizyki 3D (Three.js/Cannon/DiceBox) nie może wchodzić w skład głównego chunka aplikacji (`initial bundle`).
* Wymagane jest zastosowanie leniwego ładowania (`dynamic import` / `lazy loading`). Biblioteki i modele 3D pobierane są z sieci dopiero przy pierwszym otwarciu okna rzutnika przez użytkownika.

### NFR-03: Dostępność i ergonomia pracy (UX & Accessibility)
* Pełna obsługa za pomocą klawiatury:
  * `D`: otwarcie/zamknięcie rzutnika.
  * `Enter`: wyzwolenie rzutu ze skompletowanej puli.
  * `Esc`: natychmiastowe zamknięcie okna lub anulowanie przeciągania.
  * `C`: wyczyszczenie puli kości.
* Kontrast tekstu wyników liczbowych względem tła musi spełniać standard **WCAG 2.1 AA** (minimum 4.5:1).

### NFR-04: Responsywność i skalowanie (Responsive Design)
* Przy rozdzielczościach ekranu poniżej **1024px szerokości** tryb swobodnego przeciągania (`draggable floating`) automatycznie przełącza się w wyśrodkowany arkusz dolny (`bottom-sheet`) lub pełnoekranowy modal.
* Transformacje położenia okna podczas przeciągania muszą być realizowane za pomocą akcelerowanych sprzętowo styli CSS (`transform: translate3d(...)`) w celu uniknięcia zjawiska *layout thrashing*.
