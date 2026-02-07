export const SPELL_CONFIG = {
  circle: {          // Quick Shot
    name: 'Quick Shot',
    speed: 400,       // px/sec (fastest)
    size: 6,          // base radius in px
    color: '#4dd0e1', // Cyan (free tier)
    baseDamage: 10,
    lifetime: 3000,   // ms
    manaCost: 0,      // Free tier
    tier: 'free'
  },
  triangle: {        // Magic Missile
    name: 'Magic Missile',
    speed: 250,       // px/sec (medium - needs time to aim)
    size: 5,
    color: '#80deea', // Light cyan (free tier)
    baseDamage: 8,
    lifetime: 4000,   // ms (longer for homing)
    manaCost: 0,
    tier: 'free'
  },
  zigzag: {          // Fireball
    name: 'Fireball',
    speed: 300,       // px/sec
    size: 8,          // bigger than others
    color: '#ff6b35', // Orange (visually distinct)
    baseDamage: 15,
    lifetime: 3000,   // ms
    manaCost: 0,
    tier: 'free',
    explosionRadius: 40 // AoE radius in px
  }
};
