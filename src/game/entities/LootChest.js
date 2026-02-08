import { rollLoot } from '../data/lootConfig.js';

class LootChest {
  constructor(x, y, tier = 1) {
    this.x = x;
    this.y = y;
    this.size = 14;
    this.tier = tier;
    this.active = true;
    this.opened = false;
    this.loot = null; // Generated on open

    // Visual
    this.bobPhase = Math.random() * Math.PI * 2;
    this.glowTimer = 0;
    this.openFlash = 0;

    // Tier-based color
    this.color = tier === 3 ? '#ffd700' : tier === 2 ? '#7c4dff' : '#42a5f5';
  }

  isPlayerInRange(player, range = 50) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    return dx * dx + dy * dy < range * range;
  }

  open() {
    if (this.opened) return null;
    this.opened = true;
    this.openFlash = 1.0;
    this.loot = rollLoot(this.tier);
    return this.loot;
  }

  update(dt) {
    if (!this.active) return;
    this.bobPhase += dt * 2;
    this.glowTimer += dt;
    if (this.openFlash > 0) this.openFlash -= dt * 2;
  }

  render(ctx) {
    if (!this.active) return;
    if (this.opened) {
      // Open flash
      if (this.openFlash > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, 30 * (1 - this.openFlash), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${this.openFlash * 0.5})`;
        ctx.fill();
        ctx.restore();
      }
      return; // Don't render opened chests
    }

    const bobY = Math.sin(this.bobPhase) * 2;
    const pulse = 0.5 + 0.3 * Math.sin(this.glowTimer * 3);

    ctx.save();

    // Chest body (rounded rectangle)
    const cx = this.x;
    const cy = this.y + bobY;
    const w = this.size * 1.4;
    const h = this.size;

    // Body
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(cx - w / 2, cy - h / 2, w, h);

    // Lid
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(cx - w / 2, cy - h / 2, w, h * 0.4);

    // Metal bands
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);

    // Lock/clasp
    ctx.beginPath();
    ctx.arc(cx, cy - h * 0.1, 3, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Sparkle particles
    for (let i = 0; i < 3; i++) {
      const angle = this.glowTimer * 2 + (i * Math.PI * 2) / 3;
      const sparkR = this.size + 6 + Math.sin(this.glowTimer * 3 + i) * 3;
      const sx = cx + Math.cos(angle) * sparkR;
      const sy = cy + bobY + Math.sin(angle) * sparkR;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 215, 0, ${0.3 + pulse * 0.3})`;
      ctx.fill();
    }

    ctx.restore();
  }

  destroy() {
    this.active = false;
  }
}

export default LootChest;
