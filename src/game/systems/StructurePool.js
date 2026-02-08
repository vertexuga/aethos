import Structure from '../entities/Structure.js';

class StructurePool {
  constructor(maxSize = 10) {
    this.structures = [];
    this.pool = [];

    for (let i = 0; i < maxSize; i++) {
      const s = new Structure();
      this.pool.push(s);
    }
  }

  spawn({ x, y, type }) {
    let structure;
    if (this.pool.length > 0) {
      structure = this.pool.pop();
    } else {
      structure = new Structure();
    }
    structure.reset({ x, y, type });
    this.structures.push(structure);
    return structure;
  }

  release(structure) {
    structure.active = false;
    const idx = this.structures.indexOf(structure);
    if (idx !== -1) this.structures.splice(idx, 1);
    this.pool.push(structure);
  }

  update(dt, enemyPools) {
    for (const s of this.structures) {
      if (s.active) {
        s.update(dt, enemyPools);
      }
    }
  }

  render(ctx) {
    for (const s of this.structures) {
      if (s.active) s.render(ctx);
    }
  }

  getActive() {
    return this.structures.filter(s => s.active);
  }

  getBuilt() {
    return this.structures.filter(s => s.active && s.built);
  }

  getNearestInRange(x, y, range) {
    let nearest = null;
    let nearestDist = range;
    for (const s of this.structures) {
      if (!s.active) continue;
      const dx = s.x - x;
      const dy = s.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = s;
      }
    }
    return nearest;
  }

  getNearestUnbuiltInRange(x, y, range) {
    let nearest = null;
    let nearestDist = range;
    for (const s of this.structures) {
      if (!s.active || s.built) continue;
      const dx = s.x - x;
      const dy = s.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = s;
      }
    }
    return nearest;
  }

  getNearestDamagedInRange(x, y, range) {
    let nearest = null;
    let nearestDist = range;
    for (const s of this.structures) {
      if (!s.active || !s.built) continue;
      if (s.hp >= s.maxHp) continue;
      const dx = s.x - x;
      const dy = s.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = s;
      }
    }
    return nearest;
  }

  getNearestUpgradeableInRange(x, y, range) {
    let nearest = null;
    let nearestDist = range;
    for (const s of this.structures) {
      if (!s.active || !s.built) continue;
      if (!s.canUpgrade()) continue;
      const dx = s.x - x;
      const dy = s.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = s;
      }
    }
    return nearest;
  }

  getPlayerDamageReduction(player) {
    let reduction = 0;
    for (const s of this.structures) {
      if (!s.active || !s.built || s.type !== 'shieldPylon') continue;
      if (s.isPlayerInAura(player)) {
        reduction = Math.max(reduction, s.damageReduction);
      }
    }
    return reduction;
  }

  getManaRegenBoost(player) {
    let boost = 0;
    for (const s of this.structures) {
      if (!s.active || !s.built || s.type !== 'manaWell') continue;
      if (s.isPlayerInAura(player)) {
        boost = Math.max(boost, s.manaRegenBoost);
      }
    }
    return boost;
  }
}

export default StructurePool;
