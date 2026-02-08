export const CRYSTAL_CONFIG = {
  hp: 500,
  maxHp: 500,
  size: 24,
  color: '#00e5ff',
  warningRadius: 300, // enemies within this radius trigger warning
  maxHpGrowth: 2, // passive HP recovery per second
  // Inferno tower attack
  attackRange: 250,
  attackDPS: 5,
  maxTargets: 3,
  beamColor: '#00e5ff',
  upgrades: {
    fortify: {
      name: 'Fortify',
      description: 'Increase crystal max HP',
      maxTier: 3,
      tiers: {
        1: { hpBonus: 200, cost: { mirrorShard: 5, voidCore: 3 }, tokenCost: 1 },
        2: { hpBonus: 500, cost: { mirrorShard: 8, voidCore: 5 }, tokenCost: 2 },
        3: { hpBonus: 1000, cost: { mirrorShard: 12, voidCore: 8 }, tokenCost: 3 },
      },
    },
    regen: {
      name: 'Regeneration',
      description: 'Crystal regenerates HP over time',
      maxTier: 3,
      tiers: {
        1: { regenRate: 2, cost: { etherWisp: 5, hexThread: 3 }, tokenCost: 1 },
        2: { regenRate: 5, cost: { etherWisp: 8, hexThread: 5 }, tokenCost: 2 },
        3: { regenRate: 10, cost: { etherWisp: 12, hexThread: 8 }, tokenCost: 3 },
      },
    },
    earlyWarning: {
      name: 'Early Warning',
      description: 'Increase enemy detection radius',
      maxTier: 3,
      tiers: {
        1: { radiusBonus: 200, cost: { portalStone: 4, etherWisp: 2 }, tokenCost: 1 },
        2: { radiusBonus: 400, cost: { portalStone: 7, etherWisp: 4 }, tokenCost: 2 },
        3: { radiusBonus: 800, cost: { portalStone: 10, etherWisp: 6 }, tokenCost: 3 },
      },
    },
  },
};
