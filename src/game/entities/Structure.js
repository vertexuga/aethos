import { STRUCTURE_TYPES } from '../data/structureConfig.js';

class Structure {
  static idCounter = 0;

  constructor() {
    this.id = `structure_${Structure.idCounter++}`;
    this.x = 0;
    this.y = 0;
    this.active = false;
    this.built = false; // starts unbuilt — player must spend materials
    this.type = '';
    this.config = null;
    this.hp = 0;
    this.maxHp = 0;
    this.size = 16;

    // Turret state
    this.attackTimer = 0;
    this.turretAngle = 0;
    this.turretBullets = [];

    // Animation
    this.auraPhase = Math.random() * Math.PI * 2;
  }

  reset({ x, y, type }) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.config = STRUCTURE_TYPES[type];
    this.hp = 0;
    this.maxHp = this.config.hp;
    this.size = this.config.size;
    this.active = true;
    this.built = false; // unbuilt by default
    this.attackTimer = 0;
    this.turretBullets = [];
    this.auraPhase = Math.random() * Math.PI * 2;
  }

  build() {
    this.built = true;
    this.hp = this.maxHp;
  }

  takeDamage(amount) {
    if (!this.built) return;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.built = false;
      this.hp = 0;
    }
  }

  repair() {
    if (!this.active || !this.built) return;
    this.hp = this.maxHp;
  }

  update(dt, enemyPools) {
    if (!this.active) return;

    this.auraPhase += dt * 2;

    if (!this.built) return; // unbuilt structures don't do anything

    if (this.type === 'arcaneTurret') {
      this.updateTurret(dt, enemyPools);
    }
  }

  updateTurret(dt, enemyPools) {
    this.attackTimer += dt * 1000;

    // Update bullets
    for (let i = this.turretBullets.length - 1; i >= 0; i--) {
      const b = this.turretBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      // Check bullet-enemy collision
      if (enemyPools) {
        for (const key in enemyPools) {
          for (const enemy of enemyPools[key].getActive()) {
            if (!enemy.active) continue;
            if (enemy.isPhased) continue;
            const edx = enemy.x - b.x;
            const edy = enemy.y - b.y;
            if (edx * edx + edy * edy < (enemy.size + 3) * (enemy.size + 3)) {
              enemy.takeDamage(this.config.attackDamage);
              b.life = 0;
              break;
            }
          }
          if (b.life <= 0) break;
        }
      }

      if (b.life <= 0) this.turretBullets.splice(i, 1);
    }

    if (this.attackTimer < this.config.attackCooldown) return;

    // Find nearest enemy
    let nearest = null;
    let nearestDist = this.config.attackRange;

    if (!enemyPools) return;

    for (const key in enemyPools) {
      for (const enemy of enemyPools[key].getActive()) {
        if (!enemy.active || enemy.isPhased) continue;
        const edx = enemy.x - this.x;
        const edy = enemy.y - this.y;
        const dist = Math.sqrt(edx * edx + edy * edy);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = enemy;
        }
      }
    }

    if (nearest) {
      this.attackTimer = 0;
      const edx = nearest.x - this.x;
      const edy = nearest.y - this.y;
      const dist = Math.sqrt(edx * edx + edy * edy);
      this.turretAngle = Math.atan2(edy, edx);

      const speed = 300;
      this.turretBullets.push({
        x: this.x,
        y: this.y,
        vx: (edx / dist) * speed,
        vy: (edy / dist) * speed,
        life: 1.0,
      });
    }
  }

  isPlayerInAura(player) {
    if (!this.active || !this.built) return false;
    if (!this.config.auraRadius) return false;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    return (dx * dx + dy * dy) < this.config.auraRadius * this.config.auraRadius;
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();

    const pulse = 0.5 + 0.3 * Math.sin(this.auraPhase);

    // Ghost/unbuilt rendering
    if (!this.built) {
      ctx.globalAlpha = 0.25 + 0.1 * Math.sin(this.auraPhase);

      // Ghost hexagonal outline
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 6;
        const hx = this.x + Math.cos(angle) * this.size;
        const hy = this.y + Math.sin(angle) * this.size;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.strokeStyle = this.config.color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Ghost type icon (faded)
      this.renderTypeIcon(ctx);

      ctx.restore();
      return;
    }

    // Aura ring (only when built)
    if (this.config.auraRadius) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.config.auraRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${this.type === 'manaWell' ? '66, 165, 245' : '102, 187, 106'}, ${0.08 + pulse * 0.05})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Hexagonal base
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 6;
      const hx = this.x + Math.cos(angle) * this.size;
      const hy = this.y + Math.sin(angle) * this.size;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(20, 25, 40, 0.8)';
    ctx.fill();
    ctx.strokeStyle = this.config.color;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 6;
    ctx.shadowColor = this.config.color;
    ctx.stroke();

    // Type-specific icon
    ctx.shadowBlur = 0;
    this.renderTypeIcon(ctx);

    // Turret bullets
    for (const b of this.turretBullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ff8a65';
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#ff7043';
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Health bar (only when damaged)
    if (this.hp < this.maxHp) {
      const barWidth = 30;
      const barHeight = 4;
      const barX = this.x - barWidth / 2;
      const barY = this.y - this.size - 10;
      const hpPercent = this.hp / this.maxHp;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      const barColor = hpPercent > 0.6 ? '#4caf50' : hpPercent > 0.3 ? '#ffc107' : '#f44336';
      ctx.fillStyle = barColor;
      ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    }

    ctx.restore();
  }

  renderTypeIcon(ctx) {
    if (this.type === 'arcaneTurret') {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.turretAngle);
      ctx.fillStyle = this.config.color;
      ctx.fillRect(0, -2.5, this.size * 0.8, 5);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = this.config.color;
      ctx.fill();
    } else if (this.type === 'manaWell') {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - 7);
      ctx.quadraticCurveTo(this.x + 6, this.y + 2, this.x, this.y + 7);
      ctx.quadraticCurveTo(this.x - 6, this.y + 2, this.x, this.y - 7);
      ctx.fillStyle = this.config.color;
      ctx.fill();
    } else if (this.type === 'shieldPylon') {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - 8);
      ctx.lineTo(this.x + 7, this.y - 3);
      ctx.lineTo(this.x + 5, this.y + 5);
      ctx.lineTo(this.x, this.y + 8);
      ctx.lineTo(this.x - 5, this.y + 5);
      ctx.lineTo(this.x - 7, this.y - 3);
      ctx.closePath();
      ctx.fillStyle = this.config.color;
      ctx.fill();
    }
  }
}

export default Structure;
