import { getWaveConfig } from '../data/waveConfig.js';
import { ENEMY_CONFIG } from '../data/enemyConfig.js';

class WaveSpawner {
  constructor(enemyPools, entityManager, canvasWidth, canvasHeight) {
    this.enemyPools = enemyPools; // { slime: EnemyPool }
    this.entityManager = entityManager;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.camera = null;
    this.worldWidth = 0;
    this.worldHeight = 0;

    this.currentWave = 0;
    this.waveState = 'waiting'; // waiting | spawning | cooldown
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.spawnInterval = 0;
    this.delayTimer = 0;
    this.delayBefore = 0;
    this.totalEnemiesInWave = 0;
    this.enemiesSpawnedInWave = 0;

    // Time-based: cooldown between waves
    this.cooldownTimer = 0;
    this.waveCooldown = 60000; // 60s between waves (ms) — slow paced base defense
  }

  startNextWave() {
    this.currentWave++;

    // Get wave config (pre-defined or procedural)
    const config = getWaveConfig(this.currentWave);

    // Build spawn queue from composition
    this.spawnQueue = [];
    this.totalEnemiesInWave = 0;

    for (const comp of config.composition) {
      for (let i = 0; i < comp.count; i++) {
        this.spawnQueue.push(comp.type);
        this.totalEnemiesInWave++;
      }
    }

    // Shuffle spawn queue for variety
    this.shuffleArray(this.spawnQueue);

    // Set wave state and timers
    this.waveState = 'waiting';
    this.delayBefore = config.delayBefore;
    this.delayTimer = 0;
    this.spawnInterval = config.spawnInterval;
    this.spawnTimer = 0;
    this.enemiesSpawnedInWave = 0;

    console.log(`Wave ${this.currentWave} starting: ${this.totalEnemiesInWave} enemies`);
  }

  /**
   * Reset waves back to wave 1 (called when returning from dungeon).
   * Clears all active enemies.
   */
  resetToWave1() {
    // Release all active enemies
    for (const poolKey in this.enemyPools) {
      const active = this.enemyPools[poolKey].getActive();
      for (let i = active.length - 1; i >= 0; i--) {
        if (active[i].active) {
          active[i].active = false;
        }
      }
    }

    this.currentWave = 0;
    this.waveState = 'cooldown';
    this.cooldownTimer = 0;
    this.spawnQueue = [];
    console.log('Waves reset to level 1');
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  update(dt) {
    if (this.waveState === 'waiting') {
      // Countdown delay timer
      this.delayTimer += dt * 1000;
      if (this.delayTimer >= this.delayBefore) {
        this.waveState = 'spawning';
        this.spawnTimer = 0;
      }
    } else if (this.waveState === 'spawning') {
      // Countdown spawn timer
      this.spawnTimer += dt * 1000;
      if (this.spawnTimer >= this.spawnInterval) {
        // Spawn next enemy from queue
        if (this.spawnQueue.length > 0) {
          const enemyType = this.spawnQueue.shift();
          this.spawnEnemy(enemyType);
          this.spawnTimer = 0; // Reset timer for next spawn
        } else {
          // Queue empty — go to cooldown, then start next wave
          this.waveState = 'cooldown';
          this.cooldownTimer = 0;
          console.log(`Wave ${this.currentWave} spawned! Next wave in ${this.waveCooldown / 1000}s`);
        }
      }
    } else if (this.waveState === 'cooldown') {
      // Time-based: auto-start next wave after cooldown
      this.cooldownTimer += dt * 1000;
      if (this.cooldownTimer >= this.waveCooldown) {
        this.startNextWave();
      }
    }
  }

  setCamera(camera) {
    this.camera = camera;
  }

  setWorldSize(w, h) {
    this.worldWidth = w;
    this.worldHeight = h;
  }

  spawnEnemy(type) {
    // Spawn just outside the current viewport (or canvas if no camera)
    const viewLeft = this.camera ? this.camera.x : 0;
    const viewTop = this.camera ? this.camera.y : 0;
    const viewW = this.canvasWidth;
    const viewH = this.canvasHeight;
    const margin = 50;

    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let x, y;

    switch (edge) {
      case 0: // Top
        x = viewLeft + Math.random() * viewW;
        y = viewTop - margin;
        break;
      case 1: // Right
        x = viewLeft + viewW + margin;
        y = viewTop + Math.random() * viewH;
        break;
      case 2: // Bottom
        x = viewLeft + Math.random() * viewW;
        y = viewTop + viewH + margin;
        break;
      case 3: // Left
        x = viewLeft - margin;
        y = viewTop + Math.random() * viewH;
        break;
    }

    // Clamp spawn positions within world bounds
    if (this.worldWidth > 0 && this.worldHeight > 0) {
      x = Math.max(5, Math.min(this.worldWidth - 5, x));
      y = Math.max(5, Math.min(this.worldHeight - 5, y));
    }

    // Spawn enemy from pool
    const enemy = this.enemyPools[type].spawn({ x, y });
    enemy._zone = 'base'; // Tag as base enemy for background simulation
    this.enemiesSpawnedInWave++;
  }

  getActiveEnemyCount() {
    let count = 0;
    for (const poolKey in this.enemyPools) {
      count += this.enemyPools[poolKey].getActive().length;
    }
    return count;
  }

  setCanvasSize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  getCurrentWave() {
    return this.currentWave;
  }

  getWaveState() {
    return this.waveState;
  }
}

export default WaveSpawner;
