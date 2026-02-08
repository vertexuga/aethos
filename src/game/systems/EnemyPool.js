class EnemyPool {
  constructor(EnemyClass, poolSize = 20, player = null) {
    this.EnemyClass = EnemyClass;
    this.poolSize = poolSize;
    this.pool = [];
    this.active = [];
    this.player = player;

    // Pre-allocate pool entities
    for (let i = 0; i < poolSize; i++) {
      const enemy = new EnemyClass({ x: 0, y: 0 });
      enemy.active = false;
      this.pool.push(enemy);
    }
  }

  setPlayer(player) {
    this.player = player;
  }

  spawn({ x, y }) {
    let enemy;

    // Try to get from pool
    if (this.pool.length > 0) {
      enemy = this.pool.pop();
      enemy.reset({ x, y, player: this.player });
    } else {
      // Pool exhausted - create new entity (fallback)
      console.warn(`EnemyPool exhausted for ${this.EnemyClass.name}, creating new entity`);
      enemy = new this.EnemyClass({ x, y });
      enemy.player = this.player;
      enemy.active = true;
    }

    this.active.push(enemy);
    return enemy;
  }

  release(enemy) {
    enemy.active = false;

    // Remove from active array
    const index = this.active.indexOf(enemy);
    if (index !== -1) {
      this.active.splice(index, 1);
    }

    // Return to pool if under capacity
    if (this.pool.length < this.poolSize) {
      this.pool.push(enemy);
    }
  }

  update(dt) {
    // Update all active enemies
    for (const enemy of this.active) {
      if (enemy.active) {
        enemy.update(dt);
      }
    }

    // Iterate backwards to safely remove inactive enemies
    for (let i = this.active.length - 1; i >= 0; i--) {
      const enemy = this.active[i];

      if (!enemy.active) {
        this.release(enemy);
      }
    }
  }

  render(ctx) {
    for (const enemy of this.active) {
      if (enemy.active) {
        enemy.render(ctx);
      }
    }
  }

  getActive() {
    return this.active;
  }
}

export default EnemyPool;
