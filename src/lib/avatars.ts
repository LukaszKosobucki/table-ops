export interface AvatarPreset {
  id: string;
  name: string;
  category: 'Wojownik' | 'Magia' | 'Podstęp' | 'Wiara' | 'Natura' | 'Potwory';
  url: string;
}

/**
 * Curated high-resolution fantasy portrait presets for D&D characters & monsters.
 * Hosted via reliable CDNs (Unsplash curated high-fantasy character portraits).
 */
export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'warrior-male',
    name: 'Wojownik w zbroi płytowej',
    category: 'Wojownik',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=300&h=300&q=80',
  },
  {
    id: 'warrior-female',
    name: 'Wojowniczka z mieczem',
    category: 'Wojownik',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=300&q=80',
  },
  {
    id: 'barbarian-dwarf',
    name: 'Krasnoludzki Berserker',
    category: 'Wojownik',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&h=300&q=80',
  },
  {
    id: 'mage-wizard',
    name: 'Arcymag w szatach',
    category: 'Magia',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300&q=80',
  },
  {
    id: 'sorceress-elf',
    name: 'Elficka Zaklinaczka',
    category: 'Magia',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300&q=80',
  },
  {
    id: 'warlock-dark',
    name: 'Czarnoksiężnik Paktu',
    category: 'Magia',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&h=300&q=80',
  },
  {
    id: 'rogue-hooded',
    name: 'Łotrzyk w kapturze',
    category: 'Podstęp',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&h=300&q=80',
  },
  {
    id: 'rogue-shadow',
    name: 'Zabójczyni Cienia',
    category: 'Podstęp',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&h=300&q=80',
  },
  {
    id: 'cleric-holy',
    name: 'Kapłan Światłości',
    category: 'Wiara',
    url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&h=300&q=80',
  },
  {
    id: 'paladin-knight',
    name: 'Rycerz Paladyn',
    category: 'Wiara',
    url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=300&h=300&q=80',
  },
  {
    id: 'druid-forest',
    name: 'Druid Kniei',
    category: 'Natura',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&h=300&q=80',
  },
  {
    id: 'ranger-hunter',
    name: 'Tropicielka z łukiem',
    category: 'Natura',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&h=300&q=80',
  },
];

export function getDefaultAvatarForClass(className?: string | null): string {
  if (!className) return AVATAR_PRESETS[0].url;
  const lower = className.toLowerCase();
  if (
    lower.includes('woj') ||
    lower.includes('fight') ||
    lower.includes('barb') ||
    lower.includes('krasnolud')
  ) {
    return AVATAR_PRESETS[0].url;
  }
  if (
    lower.includes('mag') ||
    lower.includes('czarodziej') ||
    lower.includes('wiz') ||
    lower.includes('sorc')
  ) {
    return AVATAR_PRESETS[3].url;
  }
  if (
    lower.includes('łotr') ||
    lower.includes('rogu') ||
    lower.includes('mnich') ||
    lower.includes('monk')
  ) {
    return AVATAR_PRESETS[6].url;
  }
  if (lower.includes('kapł') || lower.includes('cler') || lower.includes('palad')) {
    return AVATAR_PRESETS[8].url;
  }
  if (lower.includes('druid') || lower.includes('trop') || lower.includes('rang')) {
    return AVATAR_PRESETS[10].url;
  }
  return AVATAR_PRESETS[0].url;
}
