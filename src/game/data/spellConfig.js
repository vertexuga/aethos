// Element weakness chart: fire > plant, water > fire, plant > water
export const ELEMENT_CHART = {
  fire:  { strongVs: 'plant', weakVs: 'water' },
  water: { strongVs: 'fire',  weakVs: 'plant' },
  plant: { strongVs: 'water', weakVs: 'fire'  }
};

// Returns damage multiplier for attacker element vs defender element
export function getElementalMultiplier(attackElement, defendElement) {
  if (!attackElement) return 1.0; // No element (Quick Shot) = neutral
  if (!defendElement) return 1.0; // No element on defender = neutral
  const chart = ELEMENT_CHART[attackElement];
  if (!chart) return 1.0;
  if (chart.strongVs === defendElement) return 2.5;
  return 0.7; // Wrong element
}

export const SPELL_CONFIG = {
  circle: {          // Quick Shot
    name: 'Quick Shot',
    element: null,    // No element — 1x on everything
    speed: 280,       // px/sec (reduced from 400)
    size: 12,         // base radius in px (increased from 6)
    color: '#4dd0e1', // Cyan (free tier)
    baseDamage: 10,
    lifetime: 3000,   // ms
    manaCost: 0,      // Free tier
    tier: 'free',
    piercing: true
  },
  triangle: {        // Magic Missile
    name: 'Magic Missile',
    element: 'water', // Water element — 2.5x vs fire
    speed: 175,       // px/sec (reduced from 250)
    size: 10,         // increased from 5
    color: '#4fc3f7', // Blue water color
    baseDamage: 8,
    lifetime: 4000,   // ms (longer for homing)
    manaCost: 0,
    tier: 'free',
    piercing: true
  },
  zigzag: {          // Fireball
    name: 'Fireball',
    element: 'fire',  // Fire element — 2.5x vs plant
    speed: 210,       // px/sec (reduced from 300)
    size: 14,         // increased from 8
    color: '#ff6b35', // Orange (visually distinct)
    baseDamage: 15,
    lifetime: 3000,   // ms
    manaCost: 0,
    tier: 'free',
    piercing: true,
    explosionRadius: 50 // AoE radius in px (increased from 40)
  }
};
