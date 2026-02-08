export const ENEMY_CONFIG = {
  slime: {
    hp: 25,
    speed: 65,
    contactDamage: 10,
    size: 10,
    color: '#4caf50',
    element: 'plant',
    xpReward: 10,
    dashSpeed: 280,
    dashDuration: 200,
    dashCooldown: 3000,
    dashTriggerRange: 100,
    dashChargeTime: 600,
  },
  spellThief: {
    hp: 40,
    speed: 55,
    contactDamage: 8,
    size: 16,
    color: '#9c27b0',     // Purple
    element: null,
    xpReward: 25,
    copyDelay: 2000,      // ms before firing copied spell
  },
  gravityWell: {
    hp: 60,
    speed: 25,             // Slow drift toward player
    contactDamage: 0,
    size: 20,
    color: '#37474f',     // Dark obsidian
    element: null,
    xpReward: 30,
    pullForce: 80,        // px/sec pull strength
    pullRadius: 200,      // px
    pulseRadius: 60,      // px — explosion trigger distance
    pulseDamage: 15,
    pulseCooldown: 3000,  // ms
  },
  phaseWraith: {
    hp: 35,
    speed: 75,
    contactDamage: 15,
    size: 14,
    color: '#b0bec5',     // Pale silver
    element: 'water',
    xpReward: 20,
    phaseDuration: 2000,  // ms invulnerable
    visibleDuration: 3000,// ms vulnerable
  },
  riftCaller: {
    hp: 45,
    speed: 40,
    contactDamage: 5,
    size: 16,
    color: '#7c4dff',     // Deep purple
    element: null,
    xpReward: 35,
    summonCount: 3,
    summonCooldown: 6000, // ms
    fleeRadius: 180,      // px — runs away when player is closer
  },
  curseHexer: {
    hp: 30,
    speed: 50,
    contactDamage: 8,
    size: 15,
    color: '#e040fb',     // Magenta-pink
    element: null,
    xpReward: 25,
    beamRange: 250,       // px
    beamChargeTime: 1500, // ms telegraph before firing
    curseDuration: 3000,  // ms slow duration
    curseSlow: 0.5,       // 50% speed reduction
    beamCooldown: 5000,   // ms between beam attempts
    beamDamage: 15,
  }
};
