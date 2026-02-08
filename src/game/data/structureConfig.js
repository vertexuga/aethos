export const STRUCTURE_TYPES = {
  arcaneTurret: {
    name: 'Arcane Turret',
    hp: 120,
    size: 18,
    color: '#ff7043',
    attackRange: 200,
    attackDamage: 8,
    attackCooldown: 1200, // ms
    buildCost: { mirrorShard: 3, voidCore: 2 },
  },
  manaWell: {
    name: 'Mana Well',
    hp: 80,
    size: 16,
    color: '#42a5f5',
    auraRadius: 150,
    manaRegenBoost: 8, // extra mana/sec when in range
    buildCost: { etherWisp: 4, hexThread: 1 },
  },
  shieldPylon: {
    name: 'Shield Pylon',
    hp: 100,
    size: 16,
    color: '#66bb6a',
    auraRadius: 180,
    damageReduction: 0.25, // 25% damage reduction
    buildCost: { portalStone: 3, etherWisp: 2 },
  },
};

export function getStructurePlacements(worldWidth, worldHeight) {
  const cx = worldWidth / 2;
  const cy = worldHeight / 2;

  return [
    { type: 'arcaneTurret', x: cx - 300, y: cy - 200 },
    { type: 'arcaneTurret', x: cx + 300, y: cy + 200 },
    { type: 'manaWell',     x: cx,       y: cy - 350 },
    { type: 'shieldPylon',  x: cx - 250, y: cy + 250 },
    { type: 'shieldPylon',  x: cx + 250, y: cy - 250 },
  ];
}
