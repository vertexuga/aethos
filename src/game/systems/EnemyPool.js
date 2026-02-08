class EnemyPool {
  constructor(EnemyClass, poolSize = 20, player = null) {
    this.EnemyClass = EnemyClass;
    this.poolSize = poolSize;
    this.pool = [];
    this.active = [];
    this.player = player;
    this.crystal = null;
    this.wallSystem = null;
    this.camera = null;

    // Distance culling with hysteresis to prevent jitter
    this.sleepRange = 1200;     // go to sleep beyond this
    this.wakeRange = 1000;      // wake up when closer than this

    // Pre-allocate pool entities
    for (let i = 0; i < poolSize; i++) {
      const enemy = new EnemyClass({ x: 0, y: 0 });
      enemy.active = false;
      enemy._sleeping = false;
      this.pool.push(enemy);
    }
  }

  setPlayer(player) {
    this.player = player;
  }

  setCamera(camera) {
    this.camera = camera;
  }

  setCrystal(crystal) {
    this.crystal = crystal;
    for (const enemy of this.pool) {
      enemy.crystal = crystal;
    }
    for (const enemy of this.active) {
      enemy.crystal = crystal;
    }
  }

  setWallSystem(wallSystem) {
    this.wallSystem = wallSystem;
    for (const enemy of this.pool) {
      enemy.wallSystem = wallSystem;
    }
    for (const enemy of this.active) {
      enemy.wallSystem = wallSystem;
    }
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
      enemy.wallSystem = this.wallSystem;
      enemy.active = true;
    }

    enemy.crystal = this.crystal;
    enemy._sleeping = false;
    // Initialize prev position to spawn position (no interpolation on first frame)
    enemy.prevX = x;
    enemy.prevY = y;
    // Tag with zone (default 'base', overridden to 'dungeon' by GameEngine)
    enemy._zone = 'base';

    this.active.push(enemy);
    return enemy;
  }

  release(enemy) {
    enemy.active = false;
    enemy._sleeping = false;

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

  setActiveZone(zone) {
    this._activeZone = zone;
  }

  update(dt) {
    const px = this.player ? this.player.x : 0;
    const py = this.player ? this.player.y : 0;
    const sleepSq = this.sleepRange * this.sleepRange;
    const wakeSq = this.wakeRange * this.wakeRange;
    const activeZone = this._activeZone || 'base';

    for (const enemy of this.active) {
      if (!enemy.active) continue;

      // Skip enemies not in the active zone (base sim handles base enemies)
      if (enemy._zone !== activeZone) continue;

      // Distance culling with hysteresis
      if (this.player) {
        const edx = enemy.x - px;
        const edy = enemy.y - py;
        const distSq = edx * edx + edy * edy;

        if (enemy._sleeping) {
          // Wake up only when close enough (inner threshold)
          if (distSq < wakeSq) {
            enemy._sleeping = false;
          } else {
            continue; // still sleeping
          }
        } else {
          // Fall asleep when too far (outer threshold)
          if (distSq > sleepSq) {
            enemy._sleeping = true;
            enemy.vx = 0;
            enemy.vy = 0;
            continue;
          }
        }
      }

      enemy.update(dt);
    }

    // Iterate backwards to safely remove inactive enemies
    for (let i = this.active.length - 1; i >= 0; i--) {
      const enemy = this.active[i];

      if (!enemy.active) {
        this.release(enemy);
      }
    }
  }

  render(ctx, interpolation = 1) {
    // Render culling: skip enemies outside the camera viewport
    const cam = this.camera;
    const pad = 60; // padding so enemies don't pop in/out at edges

    const activeZone = this._activeZone || 'base';

    for (const enemy of this.active) {
      if (!enemy.active) continue;

      // Skip enemies not in the active zone
      if (enemy._zone !== activeZone) continue;

      // Skip sleeping enemies entirely
      if (enemy._sleeping) continue;

      // Viewport cull
      if (cam) {
        if (enemy.x + enemy.size + pad < cam.x ||
            enemy.x - enemy.size - pad > cam.x + cam.viewWidth ||
            enemy.y + enemy.size + pad < cam.y ||
            enemy.y - enemy.size - pad > cam.y + cam.viewHeight) {
          continue;
        }
      }

      // Interpolate position for smooth rendering between physics steps
      const physX = enemy.x;
      const physY = enemy.y;
      if (enemy.prevX !== undefined) {
        enemy.x = enemy.prevX + (physX - enemy.prevX) * interpolation;
        enemy.y = enemy.prevY + (physY - enemy.prevY) * interpolation;
      }

      enemy.render(ctx);

      // Restore physics position
      enemy.x = physX;
      enemy.y = physY;
    }
  }

  getActive() {
    return this.active;
  }
}

export default EnemyPool;
