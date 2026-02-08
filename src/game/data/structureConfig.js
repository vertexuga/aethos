export const STRUCTURE_TYPES = {
  arcaneTurret: {
    name: 'Arcane Turret',
    size: 18,
    color: '#ff7043',
    tiers: {
      1: {
        hp: 120,
        attackRange: 350,
        attackDamage: 16,
        attackCooldown: 1000,
        bulletSpeed: 500,
        barrels: 1,
      },
      2: {
        hp: 160,
        attackRange: 400,
        attackDamage: 20,
        attackCooldown: 800,
        bulletSpeed: 550,
        barrels: 2,
      },
      3: {
        hp: 200,
        attackRange: 450,
        attackDamage: 24,
        attackCooldown: 600,
        bulletSpeed: 600,
        barrels: 3,
      },
    },
    buildCost: { mirrorShard: 3, voidCore: 2 },
    upgradeCost: {
      2: { mirrorShard: 5, voidCore: 3 },
      3: { mirrorShard: 8, voidCore: 5 },
    },
  },
  manaWell: {
    name: 'Mana Well',
    size: 16,
    color: '#42a5f5',
    tiers: {
      1: {
        hp: 80,
        auraRadius: 150,
        manaRegenBoost: 8,
      },
      2: {
        hp: 110,
        auraRadius: 200,
        manaRegenBoost: 14,
      },
      3: {
        hp: 140,
        auraRadius: 250,
        manaRegenBoost: 22,
      },
    },
    buildCost: { etherWisp: 4, hexThread: 1 },
    upgradeCost: {
      2: { etherWisp: 6, hexThread: 2 },
      3: { etherWisp: 10, hexThread: 4 },
    },
  },
  shieldPylon: {
    name: 'Shield Pylon',
    size: 16,
    color: '#66bb6a',
    tiers: {
      1: {
        hp: 100,
        auraRadius: 180,
        damageReduction: 0.25,
      },
      2: {
        hp: 130,
        auraRadius: 220,
        damageReduction: 0.35,
      },
      3: {
        hp: 160,
        auraRadius: 260,
        damageReduction: 0.50,
      },
    },
    buildCost: { portalStone: 3, etherWisp: 2 },
    upgradeCost: {
      2: { portalStone: 5, etherWisp: 4 },
      3: { portalStone: 8, etherWisp: 6 },
    },
  },
  voidChest: {
    name: 'Void Chest',
    hp: 200,
    size: 18,
    color: '#7c4dff',
    buildCost: { voidCore: 2, portalStone: 2 },
    grantsSlot: true,
    maxTier: 1, // not upgradeable
  },
};

/**
 * Get the merged config for a structure type at a given tier.
 * Returns a flat object with all properties for that tier.
 */
export function getStructureTierConfig(type, tier) {
  const base = STRUCTURE_TYPES[type];
  if (!base) return null;

  // VoidChest has no tiers
  if (!base.tiers) {
    return {
      name: base.name,
      hp: base.hp,
      size: base.size,
      color: base.color,
      buildCost: base.buildCost,
      grantsSlot: base.grantsSlot,
    };
  }

  const tierData = base.tiers[tier] || base.tiers[1];
  return {
    name: base.name,
    size: base.size,
    color: base.color,
    buildCost: base.buildCost,
    ...tierData,
  };
}

export function getStructurePlacements(worldWidth, worldHeight) {
  const cx = worldWidth / 2;
  const cy = worldHeight / 2;

  return [
    // Inner ring (~150px) — close to crystal
    { type: 'arcaneTurret', x: cx - 150, y: cy - 150 },
    { type: 'arcaneTurret', x: cx + 150, y: cy + 150 },
    { type: 'arcaneTurret', x: cx + 150, y: cy - 150 },
    { type: 'arcaneTurret', x: cx - 150, y: cy + 150 },

    // Mid ring (~350px) — between inner and outer walls
    { type: 'manaWell',     x: cx, y: cy - 350 },
    { type: 'manaWell',     x: cx, y: cy + 350 },
    { type: 'shieldPylon',  x: cx - 350, y: cy },
    { type: 'shieldPylon',  x: cx + 350, y: cy },

    // Outer ring (~500px) — near perimeter
    { type: 'voidChest',    x: cx + 500, y: cy },
    { type: 'voidChest',    x: cx - 500, y: cy },
    { type: 'voidChest',    x: cx, y: cy + 500 },
  ];
}
