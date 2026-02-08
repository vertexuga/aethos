export const WAVE_CONFIG = [
  {
    wave: 1,
    composition: [{ type: 'slime', count: 2 }],
    spawnInterval: 1400,
    delayBefore: 2000,
  },
  {
    wave: 2,
    composition: [{ type: 'slime', count: 3 }],
    spawnInterval: 1200,
    delayBefore: 3000,
  },
  {
    wave: 3,
    composition: [
      { type: 'slime', count: 3 },
      { type: 'phaseWraith', count: 1 },
    ],
    spawnInterval: 1100,
    delayBefore: 3000,
  },
  {
    wave: 4,
    composition: [
      { type: 'slime', count: 4 },
      { type: 'gravityWell', count: 1 },
      { type: 'phaseWraith', count: 1 },
    ],
    spawnInterval: 1000,
    delayBefore: 3000,
  },
  {
    wave: 5,
    composition: [
      { type: 'slime', count: 4 },
      { type: 'spellThief', count: 1 },
      { type: 'curseHexer', count: 1 },
    ],
    spawnInterval: 1000,
    delayBefore: 3000,
  },
  {
    wave: 6,
    composition: [
      { type: 'slime', count: 5 },
      { type: 'riftCaller', count: 1 },
      { type: 'phaseWraith', count: 2 },
    ],
    spawnInterval: 900,
    delayBefore: 3000,
  },
  {
    wave: 7,
    composition: [
      { type: 'slime', count: 5 },
      { type: 'spellThief', count: 1 },
      { type: 'gravityWell', count: 1 },
      { type: 'curseHexer', count: 1 },
      { type: 'riftCaller', count: 1 },
    ],
    spawnInterval: 800,
    delayBefore: 3000,
  },
  {
    wave: 8,
    composition: [
      { type: 'slime', count: 6 },
      { type: 'spellThief', count: 2 },
      { type: 'phaseWraith', count: 2 },
      { type: 'gravityWell', count: 1 },
    ],
    spawnInterval: 700,
    delayBefore: 3000,
  },
];

// Enemy types available for procedural waves
const ENEMY_TYPES = ['slime', 'phaseWraith', 'gravityWell', 'spellThief', 'curseHexer', 'riftCaller'];

/**
 * Get wave config for wave N, generating procedural configs beyond defined waves
 */
export function getWaveConfig(waveNumber) {
  if (waveNumber <= WAVE_CONFIG.length) {
    return WAVE_CONFIG[waveNumber - 1];
  }

  // Procedural generation beyond wave 8 — very slow scaling
  const extra = waveNumber - WAVE_CONFIG.length;
  const slimeCount = 6 + Math.floor(extra * 0.3);

  const composition = [{ type: 'slime', count: slimeCount }];

  // Add enemy variety very gradually
  if (extra >= 4) composition.push({ type: 'phaseWraith', count: 1 + Math.floor(extra / 8) });
  if (extra >= 8) composition.push({ type: 'gravityWell', count: 1 + Math.floor(extra / 10) });
  if (extra >= 8) composition.push({ type: 'spellThief', count: 1 + Math.floor(extra / 10) });
  if (extra >= 12) composition.push({ type: 'curseHexer', count: 1 + Math.floor(extra / 12) });
  if (extra >= 16) composition.push({ type: 'riftCaller', count: 1 + Math.floor(extra / 12) });

  return {
    wave: waveNumber,
    composition,
    spawnInterval: Math.max(800, 1000 - extra * 5),
    delayBefore: 3000,
  };
}
