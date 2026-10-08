# User Stories: Moduł Kreatora, Zarządzania Postaciami i Systemu Awansu (Level Up & EXP)

---

## 1. Przegląd i Tworzenie Postaci (Kreator Wielokrokowy)

**Jako** Mistrz Gry  
**Chcę** mieć dedykowany widok z listą wszystkich stworzonych Bohaterów i NPC w danej sesji  
**Aby** móc szybko przeglądać stan i uczestników aktywnej kampanii.

**Jako** Mistrz Gry  
**Chcę** przejść przez 5-krokowy kreator tworzenia postaci (Rasa i Klasa, Przypisanie Atrybutów, Tożsamość i Poziom, Ekwipunek Początkowy i Zaklęcia, Podsumowanie)  
**Aby** stworzyć spójną, zbalansowaną postać gracza lub ważnego NPC zgodnie z zasadami D&D 5e.

**Jako** Mistrz Gry  
**Chcę**, aby w kroku ekwipunku i zaklęć aplikacja podpowiadała domyślny rynsztunek startowy klasy oraz filtrowała cantripy i zaklęcia wg klasy i dopuszczalnego kręgu  
**Aby** gracz lub GM nie musiał wertować podręczników w poszukiwaniu dostępnych czarów poziomu 1.

**Jako** Mistrz Gry  
**Chcę**, aby aplikacja automatycznie obliczała parametry pochodne postaci (Max HP, AC bez zbroi, Percepcja Pasywna, Premia z Biegłości oraz komórki czarów)  
**Aby** wyeliminować błędy matematyczne i przyspieszyć przygotowanie do sesji.

---

## 2. Podgląd i Modyfikacja Karty w Czasie Rzeczywistym (GM Inspection)

**Jako** Mistrz Gry  
**Chcę** móc kliknąć w kartę postaci w lewym panelu, aby otworzyć szczegółowy podgląd w środkowej kolumnie  
**Aby** mieć natychmiastowy wgląd w jej atrybuty, rzuty obronne, ekwipunek, zaklęcia i cechy odgrywania (LARP).

**Jako** Mistrz Gry  
**Chcę** mieć możliwość dodawania i usuwania przedmiotów z ekwipunku bezpośrednio w podglądzie karty  
**Aby** odzwierciedlać łupy znalezione w trakcie eksploracji i zużycie zasobów bez wchodzenia w tryb edycji całej postaci.

**Jako** Mistrz Gry  
**Chcę** mieć możliwość dodawania i usuwania znanych zaklęć z podglądu karty (z selektorem klasowym i polem Homebrew)  
**Aby** dostosowywać księgę czarów magów i kapłanów po udanej nauce lub medytacji.

**Jako** Mistrz Gry  
**Chcę** móc rzucać testy atrybutów i rzuty obronne d20 bezpośrednio z karty postaci jednym kliknięciem, co automatycznie otwiera podręczny rzutnik kości z przygotowaną pulą 1k20 i wyliczonym modyfikatorem  
**Aby** natychmiast otrzymać wynik z uwzględnieniem modyfikatorów cechy w czasie gry przy stole bez konieczności ręcznego konfigurowania rzutu.

---

## 3. Punkty Doświadczenia (EXP) i Kamienie Milowe (Milestones)

**Jako** Mistrz Gry  
**Chcę** widzieć pasek postępu EXP na karcie każdej postaci (aktualny EXP, próg kolejnego poziomu oraz procentowy postęp)  
**Aby** gracze i ja wiedzieli, jak blisko awansu znajduje się dany bohater.

**Jako** Mistrz Gry  
**Chcę** móc dodawać punkty EXP indywidualnie do wybranej postaci za pomocą szybkiego przycisku `+ EXP`  
**Aby** nagradzać graczy za unikalne akcje fabularne, sprytne fortele lub indywidualne cele.

**Jako** Mistrz Gry  
**Chcę** mieć możliwość grupowego rozdzielenia zdobytego EXP na całą drużynę (np. po wygranej potyczce z kalkulatora potworów lub za ukończenie zadania)  
**Aby** sprawiedliwie i błyskawicznie podzielić punkty bez konieczności ręcznego dzielenia i wpisywania każdemu z osobna.

**Jako** Mistrz Gry  
**Chcę** mieć opcję natychmiastowego awansu postaci w trybie kamieni milowych (Milestone) jednym kliknięciem  
**Aby** móc prowadzić kampanie fabularne nieoparte na skrupulatnym liczeniu punktów doświadczenia.

---

## 4. System Awansu Postaci (Level Up Modal)

**Jako** Mistrz Gry i Gracz  
**Chcę**, aby po osiągnięciu progu EXP (lub kliknięciu awansu Milestone) pojawiał się wyraźny przycisk „Awans Dostępny! ✨” otwierający dedykowany kreator awansu  
**Aby** proces podnoszenia poziomu był uroczysty, przejrzysty i prowadzony krok po kroku.

**Jako** Gracz i Mistrz Gry  
**Chcę** mieć wybór sposobu zwiększenia maksymalnego HP przy awansie: albo oficjalna średnia klasy (np. d8 $\rightarrow$ 5 + CON mod), albo rzut kością Hit Die danej klasy (1k8 + CON mod)  
**Aby** zachować elastyczność między bezpieczeństwem a dreszczykiem emocji z rzutu fizyczną lub cyfrową kością.

**Jako** Gracz i Mistrz Gry  
**Chcę**, aby na poziomach z prawem do Zwiększenia Wartości Cech (ASI: 4, 8, 12, 16, 19, a dla Wojownika także 6 i 14, dla Łotrzyka 10) modal pozwalał na przydział 2 punktów (+2 do jednej cechy lub 2x +1 do dwóch różnych cech z limitem 20)  
**Aby** rozwijać kluczowe atrybuty postaci zgodnie z mechaniką D&D 5e.

**Jako** Gracz postaci czarującej i Mistrz Gry  
**Chcę**, aby po awansie na poziom aplikacja automatycznie zaktualizowała komórki czarów oraz umożliwiła wybór nowych zaklęć z Kompendium z poszanowaniem reguł klasy (2 darmowe czary do księgi dla Czarodzieja, 1 dla klas poznających czary, pełna lista dla klas przygotowujących jak Kleryk/Druid/Paladyn) oraz licznikiem i opcją odblokowania limitu dla GM-a  
**Aby** gracz i Mistrz Gry dokładnie wiedzieli ile zaklęć przysługuje postaci wg D&D 5e, zachowując pełną swobodę w przypadku zwojów i zasad domowych.

**Jako** Mistrz Gry  
**Chcę**, aby po zatwierdzeniu awansu wszystkie statystyki pochodne (nowe Max HP, AC, Percepcja Pasywna, modyfikatory) przeliczyły się automatycznie, a na Osi Czasu Sesji pojawiła się pamiątkowa notatka o awansie  
**Aby** stan sesji był w 100% zsynchronizowany, a historia kampanii wzbogacona o kamień milowy bohaterów.

---

## 5. Awatary Postaci i Rzucanie Zaklęć (In-Game & Utility)

**Jako** Mistrz Gry i Gracz  
**Chcę** móc wybrać awatar dla mojej postaci z gotowej galerii estetycznych portretów klas/ras lub wkleić bezpośredni link URL do zewnętrznego obrazka  
**Aby** postacie były natychmiast rozpoznawalne na liście drużyny, w kolejce inicjatywy oraz w kronice walki.

**Jako** Mistrz Gry  
**Chcę** móc rzucić dowolne zaklęcie bezpośrednio z podglądu karty postaci przyciskiem `Rzuć` zarówno podczas walki, jak i poza nią (czary użytkowe i cantripy)  
**Aby** aplikacja automatycznie zużyła odpowiednią komórkę czarów (dla zaklęć 1. kręgu wzwyż) oraz odnotowała użycie magii w historii sesji / kronice walki.

**Jako** Mistrz Gry  
**Chcę**, aby rzucenie cantripu (sztuczki) nie zużywało komórek czarów, lecz było odnotowywane jako darmowa akcja magiczna  
**Aby** mechanika zaklęć poziomu 0 działała zgodnie z oficjalnymi zasadami D&D 5e bez marnowania cennych slotów.

**Jako** Mistrz Gry  
**Chcę**, aby w przypadku wyczerpania komórek czarów bazowego kręgu danego zaklęcia system umożliwiał rzucenie go przy użyciu najniższego dostępnego wyższego kręgu (Upcasting, np. zaklęcie 2. kręgu rzucone za slot 3. kręgu)  
**Aby** postacie czarujące mogły swobodnie korzystać ze swoich zaklęć zgodnie z zasadami rzucania czarów wyższego poziomu w D&D 5e.