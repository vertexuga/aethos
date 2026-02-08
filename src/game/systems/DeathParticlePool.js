import DeathParticle from '../entities/enemies/DeathParticle.js';

class DeathParticlePool {
  constructor(entityManager, poolSize = 80) {
    this.entityManager = entityManager;
    this.poolSize = poolSize;
    this.pool = [];
    this.active = [];

    // Pre-allocate pool entities
    // 80 particles: 20 enemies max * 8 particles each = 160,
    // but particles die in 500ms so pool recycles fast enough
    for (let i = 0; i < poolSize; i++) {
      const particle = new DeathParticle({ x: 0, y: 0, vx: 0, vy: 0, color: '#ffffff' });
      particle.active = false;
      this.pool.push(particle);
    }
  }

  spawn({ x, y, vx, vy, color, lifetime = 500 }) {
    let particle;

    // Try to get from pool
    if (this.pool.length > 0) {
      particle = this.pool.pop();
      particle.reset({ x, y, vx, vy, color, lifetime });
    } else {
      // Pool exhausted - create new entity (fallback)
      console.warn('DeathParticlePool exhausted, creating new particle');
      particle = new DeathParticle({ x, y, vx, vy, color, lifetime });
    }

    this.active.push(particle);
    this.entityManager.add(particle);
    return particle;
  }

  release(particle) {
    particle.active = false;

    // Remove from active array
    const index = this.active.indexOf(particle);
    if (index !== -1) {
      this.active.splice(index, 1);
    }

    // Return to pool if under capacity
    if (this.pool.length < this.poolSize) {
      this.pool.push(particle);
    }
  }

  update(dt) {
    // Iterate backwards to safely remove inactive particles
    for (let i = this.active.length - 1; i >= 0; i--) {
      const particle = this.active[i];

      if (!particle.active) {
        this.release(particle);
      }
    }
  }

  spawnBurst(x, y, color, count = 8) {
    // Spawn particles in radial pattern
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 120 + Math.random() * 60; // 120-180 px/sec with randomness
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      this.spawn({ x, y, vx, vy, color, lifetime: 500 });
    }
  }

  getActive() {
    return this.active;
  }
}

export default DeathParticlePool;
