export interface CharacterStats {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  hp: number;
  maxHp: number;
  ac: number;
  passivePerception: number;
  stats: CharacterStats;
}

export interface RaceOption {
  name: string;
  bonus: string;
  desc: string;
}

export interface ClassOption {
  name: string;
  hitDie: number;
  primary: string;
  desc: string;
}

export const RACES: RaceOption[] = [
  {
    name: 'Człowiek (Human)',
    bonus: '+1 do wszystkich cech',
    desc: 'Wszechstronni i ambitni mieszkańcy Faerûnu.',
  },
  {
    name: 'Elf (Elf)',
    bonus: '+2 DEX, Widzenie w ciemności',
    desc: 'Szlachetni i długowieczni, z naturalną biegłością w magii lub łucznictwie.',
  },
  {
    name: 'Krasnolud (Dwarf)',
    bonus: '+2 CON, Odporność na trucizny',
    desc: 'Twardzi jak skała mistrzowie rzemiosła i topora.',
  },
  {
    name: 'Niziołek (Halfling)',
    bonus: '+2 DEX, Szczęście niziołka',
    desc: 'Zwrotni i odważni, potrafią przerzucać pechowe jedynki na D20.',
  },
  {
    name: 'Smocze Dziecię (Dragonborn)',
    bonus: '+2 STR, +1 CHA, Zioło smocze',
    desc: 'Dumni wojownicy władający żywiołami smoczych przodków.',
  },
];

export const CLASSES: ClassOption[] = [
  {
    name: 'Wojownik (Fighter)',
    hitDie: 10,
    primary: 'STR / DEX',
    desc: 'Mistrz walki w zwarciu i dystansie.',
  },
  {
    name: 'Czarodziej (Wizard)',
    hitDie: 6,
    primary: 'INT',
    desc: 'Władca potężnych zaklęć z księgi czarów.',
  },
  {
    name: 'Paladyn (Paladin)',
    hitDie: 10,
    primary: 'STR / CHA',
    desc: 'Święty rycerz związany przysięgą i boskim światłem.',
  },
  {
    name: 'Łotrzyk (Rogue)',
    hitDie: 8,
    primary: 'DEX',
    desc: 'Mistrz podstępu, skradania i precyzyjnych ciosów w czułe punkty.',
  },
  {
    name: 'Kleryk (Cleric)',
    hitDie: 8,
    primary: 'WIS',
    desc: 'Boski pośrednik leczący rany i rozpraszający mrok.',
  },
];
