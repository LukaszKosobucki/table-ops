# Schemat Bazy Danych (Supabase PostgreSQL)

Poniżej znajduje się uproszczony schemat encji i ich relacji. 

## Tabele Główne

### `sessions`
* `id` (UUID, PK)
* `name` (String)
* `created_at` (Timestamp)
* `updated_at` (Timestamp)

### `characters`
* `id` (UUID, PK)
* `session_id` (UUID, FK -> sessions.id)
* `type` (Enum: 'HERO', 'NPC')
* `name` (String)
* `class` (String, nullable)
* `level` (Int, domyślnie 1)
* `max_hp` (Int)
* `current_hp` (Int)
* `armor_class` (Int)
* `stats` (JSONB) - np. { str: 10, dex: 14... }
* `proficiencies` (JSONB)
* `traits` (JSONB)
* `inventory` (JSONB) - przedmioty
* `spells` (JSONB) - znane zaklęcia i stan slotów

## Tabele Potyczek (Encounter Builder)

### `encounter_groups`
* `id` (UUID, PK)
* `session_id` (UUID, FK -> sessions.id)
* `name` (String) - np. "Loch pokój 1"

### `encounter_members`
* `id` (UUID, PK)
* `group_id` (UUID, FK -> encounter_groups.id)
* `character_id` (UUID, FK -> characters.id, nullable) - jeśli to postać z sesji
* `api_monster_id` (String, nullable) - ID potwora z zewnętrznego API D&D 5e

## Tabele Aktywnej Walki (Combat Tracker)

### `combats`
* `id` (UUID, PK)
* `session_id` (UUID, FK -> sessions.id)
* `status` (Enum: 'PREPARING', 'ACTIVE', 'FINISHED')
* `current_round` (Int)
* `current_turn_index` (Int)
* `created_at` (Timestamp)
* `ended_at` (Timestamp, nullable)

### `combatants`
* `id` (UUID, PK)
* `combat_id` (UUID, FK -> combats.id)
* `character_id` (UUID, FK -> characters.id, nullable)
* `api_monster_id` (String, nullable)
* `name_override` (String) - np. "Bandit #1"
* `initiative` (Int)
* `current_hp` (Int)
* `max_hp` (Int)

### `combat_statuses`
* `id` (UUID, PK)
* `combatant_id` (UUID, FK -> combatants.id)
* `status_name` (String) - np. 'Poisoned'
* `duration_turns` (Int) - odlicza w dół do 0

## Tabele Logów i Historii

### `session_logs`
* `id` (UUID, PK)
* `session_id` (UUID, FK -> sessions.id)
* `combat_id` (UUID, FK -> combats.id, nullable)
* `log_type` (Enum: 'REST_SHORT', 'REST_LONG', 'COMBAT_END', 'SPELL_CAST', 'COMBAT_ACTION')
* `description` (Text)
* `metadata` (JSONB) - np. { hp_before: 10, hp_after: 5 }
* `created_at` (Timestamp)