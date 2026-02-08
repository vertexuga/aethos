// Loot tables for dungeon chests by tier
export const LOOT_TABLES = {
  1: {
    materials: [
      { type: 'mirrorShard', min: 2, max: 4, weight: 3 },
      { type: 'voidCore', min: 1, max: 3, weight: 2 },
      { type: 'etherWisp', min: 2, max: 4, weight: 3 },
      { type: 'portalStone', min: 1, max: 2, weight: 2 },
      { type: 'hexThread', min: 1, max: 3, weight: 2 },
    ],
    tokenChance: 0.4,
    tokenCount: { min: 1, max: 1 },
    materialRolls: 2,
    accessoryChance: 0.08,
  },
  2: {
    materials: [
      { type: 'mirrorShard', min: 3, max: 6, weight: 3 },
      { type: 'voidCore', min: 2, max: 4, weight: 2 },
      { type: 'etherWisp', min: 3, max: 5, weight: 3 },
      { type: 'portalStone', min: 2, max: 4, weight: 2 },
      { type: 'hexThread', min: 2, max: 4, weight: 2 },
    ],
    tokenChance: 0.6,
    tokenCount: { min: 1, max: 2 },
    materialRolls: 3,
    accessoryChance: 0.12,
  },
  3: {
    materials: [
      { type: 'mirrorShard', min: 4, max: 8, weight: 3 },
      { type: 'voidCore', min: 3, max: 6, weight: 2 },
      { type: 'etherWisp', min: 4, max: 7, weight: 3 },
      { type: 'portalStone', min: 3, max: 5, weight: 2 },
      { type: 'hexThread', min: 3, max: 6, weight: 2 },
    ],
    tokenChance: 0.9,
    tokenCount: { min: 1, max: 3 },
    materialRolls: 4,
    accessoryChance: 0.18,
  },
  4: {
    materials: [
      { type: 'mirrorShard', min: 5, max: 10, weight: 3 },
      { type: 'voidCore', min: 4, max: 8, weight: 2 },
      { type: 'etherWisp', min: 5, max: 9, weight: 3 },
      { type: 'portalStone', min: 4, max: 7, weight: 2 },
      { type: 'hexThread', min: 4, max: 8, weight: 2 },
    ],
    tokenChance: 1.0,
    tokenCount: { min: 2, max: 3 },
    materialRolls: 5,
    accessoryChance: 0.25,
  },
  5: {
    materials: [
      { type: 'mirrorShard', min: 7, max: 14, weight: 3 },
      { type: 'voidCore', min: 5, max: 10, weight: 2 },
      { type: 'etherWisp', min: 7, max: 12, weight: 3 },
      { type: 'portalStone', min: 5, max: 9, weight: 2 },
      { type: 'hexThread', min: 5, max: 10, weight: 2 },
    ],
    tokenChance: 1.0,
    tokenCount: { min: 2, max: 4 },
    materialRolls: 6,
    accessoryChance: 0.35,
  },
};

/**
 * Roll loot from a table
 * @param {number} tier - Dungeon tier (1-5)
 * @returns {{ materials: Array<{type, count}>, tokens: number, accessory: string|null }}
 */
export function rollLoot(tier) {
  const table = LOOT_TABLES[tier] || LOOT_TABLES[1];
  const result = { materials: [], tokens: 0, accessory: null };

  // Roll materials
  const totalWeight = table.materials.reduce((sum, m) => sum + m.weight, 0);
  for (let i = 0; i < table.materialRolls; i++) {
    let roll = Math.random() * totalWeight;
    for (const mat of table.materials) {
      roll -= mat.weight;
      if (roll <= 0) {
        const count = mat.min + Math.floor(Math.random() * (mat.max - mat.min + 1));
        const existing = result.materials.find(m => m.type === mat.type);
        if (existing) {
          existing.count += count;
        } else {
          result.materials.push({ type: mat.type, count });
        }
        break;
      }
    }
  }

  // Roll tokens
  if (Math.random() < table.tokenChance) {
    result.tokens = table.tokenCount.min + Math.floor(Math.random() * (table.tokenCount.max - table.tokenCount.min + 1));
  }

  // Roll accessory
  if (table.accessoryChance && Math.random() < table.accessoryChance) {
    // Import-free: accessory ID will be resolved by the consumer
    result.accessory = '__random__';
  }

  return result;
}
