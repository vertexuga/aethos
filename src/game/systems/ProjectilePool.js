class ProjectilePool {
  constructor(EntityClass, poolSize = 30) {
    this.EntityClass = EntityClass;
    this.poolSize = poolSize;
    this.pool = [];
    this.active = [];

    // Pre-allocate pool entities
    for (let i = 0; i < poolSize; i++) {
      const entity = new EntityClass({ x: 0, y: 0, vx: 0, vy: 0, damageModifier: 1.0 });
      entity.active = false;
      this.pool.push(entity);
    }
  }

  spawn({ x, y, vx, vy, damageModifier }) {
    let projectile;

    // Try to get from pool
    if (this.pool.length > 0) {
      projectile = this.pool.pop();
      projectile.reset({ x, y, vx, vy, damageModifier });
    } else {
      // Pool exhausted - create new entity (fallback)
      console.warn(`ProjectilePool exhausted for ${this.EntityClass.name}, creating new entity`);
      projectile = new this.EntityClass({ x, y, vx, vy, damageModifier });
    }

    this.active.push(projectile);
    return projectile;
  }

  release(projectile) {
    projectile.active = false;

    // Remove from active array
    const index = this.active.indexOf(projectile);
    if (index !== -1) {
      this.active.splice(index, 1);
    }

    // Return to pool if under capacity
    if (this.pool.length < this.poolSize) {
      this.pool.push(projectile);
    }
  }

  update(dt) {
    // Iterate backwards to safely remove inactive projectiles
    for (let i = this.active.length - 1; i >= 0; i--) {
      const projectile = this.active[i];

      if (!projectile.active) {
        this.release(projectile);
      }
    }
  }

  getActive() {
    return this.active;
  }
}

export default ProjectilePool;
