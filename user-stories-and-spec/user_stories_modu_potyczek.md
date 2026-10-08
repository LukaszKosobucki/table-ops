# User Stories: Moduł Potyczek i Walki (Encounter Builder & Combat Tracker)

**Jako** Mistrz Gry
**Chcę** móc przygotować i zapisać grupy przeciwników (np. "Wataha wilków") przed sesją
**Aby** nie tracić czasu na szukanie i dodawanie ich pojedynczo w trakcie gry.

**Jako** Mistrz Gry
**Chcę** rozpocząć nową potyczkę i dodać do niej przeciwników (z zapisanych grup, z bestiariusza) oraz bohaterów
**Aby** przygotować scenę walki.

**Jako** Mistrz Gry
**Chcę** móc wylosować inicjatywę automatycznie dla wszystkich lub wpisać ją ręcznie
**Aby** ustalić kolejność tur w sposób dopasowany do preferencji moich graczy (rzuty auto vs rzuty fizyczne).

**Jako** Mistrz Gry
**Chcę** zatwierdzić wylosowaną inicjatywę przyciskiem "Rozpocznij Walkę"
**Aby** zablokować możliwość przypadkowego przelosowania kolejności.

**Jako** Mistrz Gry
**Chcę** widzieć wyraźną oś czasu/kolejkę tur podczas aktywnej walki
**Aby** zawsze wiedzieć, czyja jest tura i kto jest następny.

**Jako** Mistrz Gry
**Chcę** nakładać statusy na uczestników walki z określeniem czasu ich trwania (w turach)
**Aby** system automatycznie odliczał ich czas i zdjął je, gdy efekt minie.

**Jako** Mistrz Gry
**Chcę** zakończyć potyczkę, co spowoduje automatyczny zapis aktualnego HP i zużytych zasobów bohaterów
**Aby** stan postaci był spójny z tym, co wydarzyło się w walce bez mojego ręcznego przepisywania.

**Jako** Mistrz Gry  
**Chcę**, aby Kronika Walki rejestrowała akcje z informacją o aktywnej turze i relacji (Aktor ➔ Cel) z czytelnymi ikonami  
**Aby** przeglądając historię walki błyskawicznie widzieć, kto zadał obrażenia lub uleczył sojusznika.

**Jako** Mistrz Gry  
**Chcę** móc rzucać zaklęcia z karty bohatera w trakcie aktywnej walki, co odnotuje wpis czaru w Kronice Walki i zużyje odpowiednią komórkę czarów  
**Aby** mechanika rzucania czarów była w pełni zintegrowana ze starciem i widoczna w kronice walki.

**Jako** Mistrz Gry  
**Chcę** móc szybko zarejestrować niestandardową akcję fabularną lub bojową dla aktualnej tury postaci (np. „Wypija miksturę”, „Szarżuje z przewagą”)  
**Aby** kronika walki wiernie odzwierciedlała przebieg starcia wykraczający poza same obrażenia i leczenie.

**Jako** Mistrz Gry  
**Chcę** móc oznaczyć ucieczkę przeciwnika z pola walki dedykowanym przyciskiem `🏳️ Ucieczka`, co przyzna drużynie 50% bazowej puli PD potwora i oznaczy go statusem `UCIEKŁ`  
**Aby** odzwierciedlać sytuacje, w których potwory ratują się ucieczką, zachowując zbalansowaną i uczciwą nagrodę w punktach doświadczenia.

**Jako** Mistrz Gry  
**Chcę**, aby silnik potyczki podczas przełączania tur (`Następna Tura`) automatycznie pomijał martwych (0 HP) oraz zbiegłych przeciwników oraz poległych bohaterów graczy, nie pomijając powalonych bohaterów graczy  
**Aby** walka toczyła się płynnie i dynamicznie, a powaleni gracze mieli zagwarantowaną turę na wykonanie rzutu obronnego przed śmiercią.

**Jako** Mistrz Gry  
**Chcę**, aby powalony bohater gracza (0 HP) posiadał na swojej karcie interaktywny wskaźnik rzutów obronnych przed śmiercią (Death Saving Throws) z 3 polami sukcesów, 3 polami porażek oraz przyciskiem rzutu kością k20 zgodnym z mechaniką D&D 5e (1 = 2 porażki, <10 = porażka, >=10 = sukces, 20 = natychmiastowe odzyskanie 1 HP i pobudka)  
**Aby** w pełni kontrolować stan zagrożenia życia postaci, doprowadzając do jej ustabilizowania (3 sukcesy) lub śmierci (3 porażki).

**Jako** Mistrz Gry  
**Chcę** wprowadzać wartości liczbowe (w tym inicjatywę potworów i bohaterów) bez wiodącego zera (np. unikając wartości „017”) oraz bez przeszkadzających strzałek spinnerów w polach liczbowych  
**Aby** wpisywanie rzutów fizycznych i modyfikatorów było maksymalnie szybkie, czyste i ergonomiczne przy stole.