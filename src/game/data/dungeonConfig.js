export const DUNGEON_TIERS = {
  1: {
    roomCount: { min: 8, max: 12 },
    roomSize: { min: 480, max: 1200 },
    corridorWidth: 120,
    enemyMultiplier: 1.0,
    lootQuality: 1,
    enemiesPerRoom: { min: 3, max: 5 },
  },
  2: {
    roomCount: { min: 10, max: 14 },
    roomSize: { min: 560, max: 1400 },
    corridorWidth: 120,
    enemyMultiplier: 1.5,
    lootQuality: 2,
    enemiesPerRoom: { min: 4, max: 7 },
  },
  3: {
    roomCount: { min: 12, max: 15 },
    roomSize: { min: 640, max: 1600 },
    corridorWidth: 120,
    enemyMultiplier: 2.0,
    lootQuality: 3,
    enemiesPerRoom: { min: 5, max: 9 },
  },
  4: {
    roomCount: { min: 13, max: 16 },
    roomSize: { min: 700, max: 1800 },
    corridorWidth: 140,
    enemyMultiplier: 2.8,
    lootQuality: 4,
    enemiesPerRoom: { min: 6, max: 11 },
  },
  5: {
    roomCount: { min: 14, max: 18 },
    roomSize: { min: 800, max: 2000 },
    corridorWidth: 140,
    enemyMultiplier: 3.5,
    lootQuality: 5,
    enemiesPerRoom: { min: 8, max: 14 },
  },
};

export const MAX_DUNGEON_FLOOR = 5;
