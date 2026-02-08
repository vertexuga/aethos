import { CRAFTED_SPELL_CONFIG } from '../../data/craftedSpellConfig.js';

const CONFIG = CRAFTED_SPELL_CONFIG.smokeBomb;

class SmokeBomb {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.timer = 0;
    this.particles = [];
    this.affectedEnemies = [];
    this.enemyPools = null;
    this.tier = 1;
    this.player = null;
  }

  activate(player, enemyPools, tier = 1) {
    this.active = true;
    this.enemyPools = enemyPools;
    this.player = player;
    this.tier = tier;
    this.timer = 0;
    this.x = player.x;
    this.y = player.y;
    this.affectedEnemies = [];

    // Generate smoke particles
    this.particles = [];
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: this.x + (Math.random() - 0.5) * CONFIG.radius,
        y: this.y + (Math.random() - 0.5) * CONFIG.radius,
        size: 5 + Math.random() * 10,
        alpha: 0.3 + Math.random() * 0.3,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
      });
    }
  }

  update(dt) {
    if (!this.active) return;

    this.timer += dt * 1000;

    // Update particles
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.size += dt * 2;
    }

    // Disrupt enemy targeting in smoke radius
    if (this.enemyPools) {
      for (const key in this.enemyPools) {
        const enemies = this.enemyPools[key].getActive();
        for (const enemy of enemies) {
          if (!enemy.active) continue;
          const dx = enemy.x - this.x;
          const dy = enemy.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONFIG.radius + enemy.size) {
            if (!enemy._smokeDisrupted) {
              enemy._smokeDisrupted = true;
              enemy._smokeOriginalPlayer = enemy.player;
              // Give enemy a fake target that wanders randomly
              enemy.player = {
                x: enemy.x + (Math.random() - 0.5) * 200,
                y: enemy.y + (Math.random() - 0.5) * 200,
                size: 16,
              };
              this.affectedEnemies.push(enemy);
            }

            // Tier 2: Poison Cloud - damage enemies inside
            if (this.tier >= 2) {
              const poisonDps = CONFIG.tiers[2].poisonDps;
              enemy.takeDamage(poisonDps * dt);
            }
          }
        }
      }
    }

    // Tier 3: Healing Mist - heal player while inside smoke
    if (this.tier >= 3 && this.player) {
      const pdx = this.player.x - this.x;
      const pdy = this.player.y - this.y;
      const playerDist = Math.sqrt(pdx * pdx + pdy * pdy);
      if (playerDist < CONFIG.radius + this.player.size) {
        const healAmount = CONFIG.tiers[3].healPerSecond * dt;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmount);
      }
    }

    // Expire
    if (this.timer >= CONFIG.duration) {
      this.deactivate();
    }
  }

  deactivate() {
    // Restore enemy targeting
    for (const enemy of this.affectedEnemies) {
      if (enemy._smokeOriginalPlayer) {
        enemy.player = enemy._smokeOriginalPlayer;
        delete enemy._smokeOriginalPlayer;
        delete enemy._smokeDisrupted;
      }
    }
    this.affectedEnemies = [];
    this.active = false;
  }

  render(ctx) {
    if (!this.active) return;

    const fadeAlpha = this.timer > CONFIG.duration - 1000
      ? (CONFIG.duration - this.timer) / 1000
      : Math.min(1, this.timer / 300);

    ctx.save();

    // Smoke cloud
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha * fadeAlpha;
      // Tier 2: green-tinted poison smoke
      ctx.fillStyle = this.tier >= 2 ? '#5d8a5d' : '#78909c';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Outer boundary
    ctx.globalAlpha = 0.1 * fadeAlpha;
    ctx.fillStyle = this.tier >= 2 ? '#2e7d32' : '#546e7a';
    ctx.beginPath();
    ctx.arc(this.x, this.y, CONFIG.radius, 0, Math.PI * 2);
    ctx.fill();

    // Tier 3: Healing mist glow when player is inside
    if (this.tier >= 3 && this.player) {
      const pdx = this.player.x - this.x;
      const pdy = this.player.y - this.y;
      const playerDist = Math.sqrt(pdx * pdx + pdy * pdy);
      if (playerDist < CONFIG.radius + this.player.size) {
        ctx.globalAlpha = 0.15 * fadeAlpha;
        ctx.fillStyle = '#80cbc4';
        ctx.beginPath();
        ctx.arc(this.x, this.y, CONFIG.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

export default SmokeBomb;
