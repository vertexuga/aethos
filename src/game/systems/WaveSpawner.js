import { getWaveConfig } from '../data/waveConfig.js';
import { ENEMY_CONFIG } from '../data/enemyConfig.js';

class WaveSpawner {
  constructor(enemyPools, entityManager, canvasWidth, canvasHeight) {
    this.enemyPools = enemyPools; // { slime: EnemyPool }
    this.entityManager = entityManager;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    this.currentWave = 0;
    this.waveState = 'waiting'; // waiting | spawning | active | cleared
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.spawnInterval = 0;
    this.delayTimer = 0;
    this.delayBefore = 0;
    this.totalEnemiesInWave = 0;
    this.enemiesSpawnedInWave = 0;

    // For cleared state transition
    this.clearedTimer = 0;
    this.clearedDelay = 1500; // 1.5s delay after clearing before next wave
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
          // Queue empty - switch to active
          this.waveState = 'active';
        }
      }
    } else if (this.waveState === 'active') {
      // Check if all enemies from this wave are dead
      const activeEnemyCount = this.getActiveEnemyCount();
      if (activeEnemyCount === 0) {
        this.waveState = 'cleared';
        this.clearedTimer = 0;
        console.log(`Wave ${this.currentWave} cleared!`);
      }
    } else if (this.waveState === 'cleared') {
      // Auto-start next wave after brief delay
      this.clearedTimer += dt * 1000;
      if (this.clearedTimer >= this.clearedDelay) {
        this.startNextWave();
      }
    }
  }

  spawnEnemy(type) {
    // Calculate random screen edge position
    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let x, y;

    switch (edge) {
      case 0: // Top
        x = Math.random() * this.canvasWidth;
        y = -30;
        break;
      case 1: // Right
        x = this.canvasWidth + 30;
        y = Math.random() * this.canvasHeight;
        break;
      case 2: // Bottom
        x = Math.random() * this.canvasWidth;
        y = this.canvasHeight + 30;
        break;
      case 3: // Left
        x = -30;
        y = Math.random() * this.canvasHeight;
        break;
    }

    // Spawn enemy from pool
    const enemy = this.enemyPools[type].spawn({ x, y });
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
