export const MATERIAL_CONFIG = {
  mirrorShard: {
    name: 'Mirror Shard',
    emoji: '\u{1FA9E}',
    color: '#c0c0ff',
    glowColor: 'rgba(192, 192, 255, 0.6)',
    description: 'A reflective fragment pulsing with stolen light.',
  },
  voidCore: {
    name: 'Void Core',
    emoji: '\u{1F573}\uFE0F',
    color: '#1a1a2e',
    glowColor: 'rgba(26, 26, 46, 0.8)',
    description: 'A dense sphere of compressed gravity.',
  },
  etherWisp: {
    name: 'Ether Wisp',
    emoji: '\u{1F4A8}',
    color: '#b0bec5',
    glowColor: 'rgba(176, 190, 197, 0.6)',
    description: 'A translucent wisp of phased energy.',
  },
  portalStone: {
    name: 'Portal Stone',
    emoji: '\u{1F52E}',
    color: '#7c4dff',
    glowColor: 'rgba(124, 77, 255, 0.6)',
    description: 'A crystallized fragment of dimensional rift.',
  },
  hexThread: {
    name: 'Hex Thread',
    emoji: '\u{1F9F5}',
    color: '#e040fb',
    glowColor: 'rgba(224, 64, 251, 0.6)',
    description: 'A shimmering thread woven from dark curses.',
  },
};

// Map enemy types to their material drop
export const ENEMY_DROP_MAP = {
  spellThief: 'mirrorShard',
  gravityWell: 'voidCore',
  phaseWraith: 'etherWisp',
  riftCaller: 'portalStone',
  curseHexer: 'hexThread',
  slime: 'etherWisp', // Slimes drop ether wisps (common material)
};

// Drop amounts by enemy category (min/max range)
export const DROP_AMOUNTS = {
  slime: { min: 0, max: 1 },
  spellThief: { min: 0, max: 1 },
  gravityWell: { min: 0, max: 2 },
  phaseWraith: { min: 0, max: 1 },
  riftCaller: { min: 0, max: 2 },
  curseHexer: { min: 0, max: 2 },
};
