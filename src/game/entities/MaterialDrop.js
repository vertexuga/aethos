import Entity from './Entity.js';
import { MATERIAL_CONFIG } from '../data/materialConfig.js';

class MaterialDrop extends Entity {
  constructor({ x, y, materialType }) {
    const config = MATERIAL_CONFIG[materialType] || MATERIAL_CONFIG.etherWisp;

    super({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 8,
      type: 'material-drop',
      color: config.color,
    });

    this.materialType = materialType || 'etherWisp';
    this.magnetRadius = 100;
    this.collectRadius = 20;
    this.lifetime = 15000; // 15s
    this.age = 0;

    // Bobbing animation
    this.bobOffset = 0;
    this.bobSpeed = 3;
    this.baseY = y;

    // Glow pulse
    this.glowPhase = Math.random() * Math.PI * 2;

    // Magnet acceleration
    this.magnetSpeed = 0;

    // Player reference (set by pool)
    this.player = null;

    // Collect callback
    this.onCollect = null;
  }

  reset({ x, y, materialType, player, onCollect }) {
    const config = MATERIAL_CONFIG[materialType] || MATERIAL_CONFIG.etherWisp;

    this.x = x;
    this.y = y;
    this.baseY = y;
    this.vx = 0;
    this.vy = 0;
    this.materialType = materialType;
    this.color = config.color;
    this.active = true;
    this.age = 0;
    this.bobOffset = 0;
    this.glowPhase = Math.random() * Math.PI * 2;
    this.magnetSpeed = 0;
    this.player = player;
    this.onCollect = onCollect;
  }

  update(dt) {
    if (!this.active) return;

    this.age += dt * 1000;

    // Expire after lifetime
    if (this.age >= this.lifetime) {
      this.destroy();
      return;
    }

    // Bobbing animation
    this.bobOffset = Math.sin(this.age / 1000 * this.bobSpeed) * 4;

    // Glow pulse
    this.glowPhase += dt * 4;

    // Magnet behavior toward player
    if (this.player) {
      const dx = this.player.x - this.x;
      const dy = this.player.y - (this.baseY + this.bobOffset);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.collectRadius) {
        // Collect
        if (this.onCollect) {
          this.onCollect(this.materialType);
        }
        this.destroy();
        return;
      }

      if (dist < this.magnetRadius) {
        // Accelerate toward player
        this.magnetSpeed = Math.min(this.magnetSpeed + 400 * dt, 350);
        const nx = dx / dist;
        const ny = dy / dist;
        this.x += nx * this.magnetSpeed * dt;
        this.baseY += ny * this.magnetSpeed * dt;
      } else {
        this.magnetSpeed = 0;
      }
    }
  }

  render(ctx) {
    if (!this.active) return;

    const renderY = this.baseY + this.bobOffset;
    const glowIntensity = 0.5 + 0.3 * Math.sin(this.glowPhase);

    // Fade out in last 3 seconds
    let alpha = 1;
    const remaining = this.lifetime - this.age;
    if (remaining < 3000) {
      alpha = remaining / 3000;
      // Blink in last 1.5 seconds
      if (remaining < 1500) {
        alpha *= (Math.sin(this.age / 100) > 0) ? 1 : 0.3;
      }
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    // Draw orb
    ctx.beginPath();
    ctx.arc(this.x, renderY, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Inner bright core
    ctx.beginPath();
    ctx.arc(this.x, renderY, this.size * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = alpha * glowIntensity * 0.8;
    ctx.fill();

    ctx.restore();
  }
}

export default MaterialDrop;
