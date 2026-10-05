export interface RollLog {
  id: string;
  dice: string;
  result: number;
  modifier: number;
  total: number;
  timestamp: string;
  isCrit: boolean;
  isFumble: boolean;
}

export interface DiceType {
  name: string;
  sides: number;
  color: string;
  desc: string;
}

export const DICE_TYPES: DiceType[] = [
  {
    name: 'D20',
    sides: 20,
    color: 'from-amber-600 to-amber-400',
    desc: 'Ataki, Rzuty obronne, Testy cech',
  },
  {
    name: 'D12',
    sides: 12,
    color: 'from-purple-600 to-indigo-500',
    desc: 'Obrażenia Barbarzyńcy, Topory dwuręczne',
  },
  {
    name: 'D10',
    sides: 10,
    color: 'from-blue-600 to-cyan-500',
    desc: 'Obrażenia Eldritch Blast, Miecz bękart',
  },
  {
    name: 'D8',
    sides: 8,
    color: 'from-emerald-600 to-teal-500',
    desc: 'Obrażenia broni jednoręcznych, Rapier',
  },
  {
    name: 'D6',
    sides: 6,
    color: 'from-rose-600 to-pink-500',
    desc: 'Kula ognia (Fireball), Atak z zaskoczenia',
  },
  {
    name: 'D4',
    sides: 4,
    color: 'from-orange-600 to-amber-500',
    desc: 'Zaklęcie Magiczny Pocisk (Magic Missile)',
  },
];
