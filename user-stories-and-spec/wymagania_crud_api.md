# Kontrakty API (Backend REST Endpoints)

## 1. Sesje (Sessions)
* `GET /api/sessions` - Zwraca listę wszystkich sesji.
* `POST /api/sessions` - Tworzy nową sesję (Body: `{ name }`).
* `PUT /api/sessions/:id` - Edytuje nazwę sesji.
* `DELETE /api/sessions/:id` - Usuwa sesję i wszystkie powiązane dane.
* `GET /api/sessions/:id/full-state` - Zwraca "stan" sesji do inicjalizacji frontendu (postacie, logi, status walki).

## 2. Postacie i NPC (Characters)
* `GET /api/sessions/:id/characters` - Zwraca listę postaci przypisanych do sesji.
* `POST /api/sessions/:id/characters` - Tworzy nową postać.
* `PUT /api/characters/:char_id` - Aktualizuje postać (np. ręczna zmiana HP, zużycie przedmiotu).
* `DELETE /api/characters/:char_id` - Usuwa postać z sesji.

## 3. Grupy Potyczkowe (Encounters)
* `GET /api/sessions/:id/encounter-groups` - Pobiera zapisane predefiniowane grupy.
* `POST /api/sessions/:id/encounter-groups` - Tworzy nową grupę (Body zawiera listę potworów/postaci).
* `PUT /api/encounter-groups/:group_id` - Edycja składu grupy.
* `DELETE /api/encounter-groups/:group_id` - Usunięcie grupy.

## 4. Walka (Combat Tracker)
* `POST /api/sessions/:id/combat` - Tworzy nową instancję walki (Status: PREPARING).
* `POST /api/combat/:combat_id/participants` - Dodaje uczestników do walki (np. rzut z grupy, bestiariusza).
* `PUT /api/combat/:combat_id/initiative` - Aktualizuje wartości inicjatywy dla uczestników.
* `POST /api/combat/:combat_id/start` - Zamraża inicjatywę i zmienia status na ACTIVE.
* `POST /api/combat/:combat_id/next-turn` - Przesuwa wskaźnik tury (aktualizuje statusy czasowe i generuje log tury).
* `PUT /api/combat/:combat_id/combatant/:combatant_id` - Modyfikuje HP, nakłada statusy (generuje `session_logs` typu COMBAT_ACTION).
* `POST /api/combat/:combat_id/end` - Kończy walkę (Status: FINISHED). Uruchamia automatyczny update tabeli `characters` (zapisanie aktualnego HP bohaterów graczy) i dodaje log typu COMBAT_END na oś czasu.

## 5. Logi (History Timeline)
* `GET /api/sessions/:id/logs` - Pobiera chronologiczną listę logów dla głównej osi czasu.
* `POST /api/sessions/:id/logs` - Ręczne dodanie zdarzenia (np. 'REST_SHORT', 'SPELL_CAST'). W przypadku odpoczynku, backend powinien automatycznie odnowić zasoby w tabeli `characters`.
* `GET /api/combat/:combat_id/logs` - Pobiera szczegółowy "Combat Log" dla konkretnej potyczki.

## 6. Kompendium (Proxy D&D 5e API)
* `GET /api/compendium/monsters?search=...` - Zwraca predefiniowane potwory.
* `GET /api/compendium/spells?search=...` - Zwraca zaklęcia.
* `GET /api/compendium/items?search=...` - Zwraca przedmioty.