import MaterialDrop from '../entities/MaterialDrop.js';

class MaterialDropPool {
  constructor(player, onCollect, poolSize = 50) {
    this.player = player;
    this.onCollect = onCollect;
    this.poolSize = poolSize;
    this.pool = [];
    this.active = [];

    // Pre-allocate pool
    for (let i = 0; i < poolSize; i++) {
      const drop = new MaterialDrop({ x: 0, y: 0, materialType: 'etherWisp' });
      drop.active = false;
      this.pool.push(drop);
    }
  }

  spawn({ x, y, materialType }) {
    let drop;

    if (this.pool.length > 0) {
      drop = this.pool.pop();
      drop.reset({ x, y, materialType, player: this.player, onCollect: this.onCollect });
    } else {
      drop = new MaterialDrop({ x, y, materialType });
      drop.player = this.player;
      drop.onCollect = this.onCollect;
      drop.active = true;
    }

    this.active.push(drop);
    return drop;
  }

  release(drop) {
    drop.active = false;

    const index = this.active.indexOf(drop);
    if (index !== -1) {
      this.active.splice(index, 1);
    }

    if (this.pool.length < this.poolSize) {
      this.pool.push(drop);
    }
  }

  update(dt) {
    // Update all active drops
    for (const drop of this.active) {
      if (drop.active) {
        drop.update(dt);
      }
    }

    // Clean up inactive drops
    for (let i = this.active.length - 1; i >= 0; i--) {
      if (!this.active[i].active) {
        this.release(this.active[i]);
      }
    }
  }

  render(ctx) {
    for (const drop of this.active) {
      if (drop.active) {
        drop.render(ctx);
      }
    }
  }

  getActive() {
    return this.active;
  }
}

export default MaterialDropPool;
