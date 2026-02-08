// Dungeon enemy stat overrides (stronger versions of base enemies)
export const DUNGEON_ENEMY_CONFIG = {
  // Dungeon Guardian — stationary room guardian with ranged attack
  dungeonGuardian: {
    hp: 120,
    speed: 0,
    contactDamage: 20,
    size: 22,
    color: '#ff6f00',
    xpReward: 50,
    attackRange: 250,
    attackCooldown: 2000,
    projectileSpeed: 180,
    projectileDamage: 18,
    projectileSize: 8,
  },
};

// Tier multipliers applied to dungeon enemies
export const DUNGEON_TIER_MULTIPLIERS = {
  1: { hp: 1.0, damage: 1.0 },
  2: { hp: 1.5, damage: 1.3 },
  3: { hp: 2.0, damage: 1.6 },
  4: { hp: 2.8, damage: 2.0 },
  5: { hp: 3.5, damage: 2.5 },
};
