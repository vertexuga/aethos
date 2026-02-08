export const WAVE_CONFIG = [
  {
    wave: 1,
    composition: [{ type: 'slime', count: 3 }],
    spawnInterval: 1200,  // ms between each spawn
    delayBefore: 2000,    // ms before wave starts
  },
  {
    wave: 2,
    composition: [{ type: 'slime', count: 5 }],
    spawnInterval: 1000,
    delayBefore: 3000,
  },
  {
    wave: 3,
    composition: [{ type: 'slime', count: 7 }],
    spawnInterval: 800,
    delayBefore: 3000,
  },
  {
    wave: 4,
    composition: [{ type: 'slime', count: 10 }],
    spawnInterval: 700,
    delayBefore: 3000,
  },
  {
    wave: 5,
    composition: [{ type: 'slime', count: 12 }],
    spawnInterval: 600,
    delayBefore: 3000,
  },
];

/**
 * Get wave config for wave N, generating procedural configs for waves beyond defined array
 * After wave 5, generate procedural waves: slime count = 12 + (wave - 5) * 2, interval decreases
 */
export function getWaveConfig(waveNumber) {
  // Return pre-defined config if it exists
  if (waveNumber <= WAVE_CONFIG.length) {
    return WAVE_CONFIG[waveNumber - 1];
  }

  // Generate procedural config for waves beyond defined array
  const baseCount = 12;
  const additionalWaves = waveNumber - 5;
  const count = baseCount + (additionalWaves * 2);
  const interval = Math.max(400, 600 - (additionalWaves * 20)); // Decrease interval but min 400ms

  return {
    wave: waveNumber,
    composition: [{ type: 'slime', count }],
    spawnInterval: interval,
    delayBefore: 3000,
  };
}
