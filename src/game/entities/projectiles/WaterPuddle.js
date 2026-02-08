import { SPELL_CONFIG } from '../../data/spellConfig.js';

class WaterPuddle {
  constructor() {
    const config = SPELL_CONFIG.circle;
    this.x = 0;
    this.y = 0;
    this.radius = config.puddleRadius || 60;
    this.duration = config.puddleDuration || 4000;
    this.slowFactor = config.slowFactor || 0.4;
    this.timeLeft = 0;
    this.active = false;
    this.age = 0;
    this.ripplePhase = 0;
  }

  spawn(x, y) {
    this.x = x;
    this.y = y;
    this.timeLeft = this.duration;
    this.age = 0;
    this.active = true;
    this.ripplePhase = 0;
  }

  update(dt) {
    if (!this.active) return;
    this.age += dt * 1000;
    this.timeLeft -= dt * 1000;
    this.ripplePhase += dt * 4;

    if (this.timeLeft <= 0) {
      this.active = false;
    }
  }

  render(ctx) {
    if (!this.active) return;

    ctx.save();

    // Fade out over last 1s
    const fadeStart = this.duration - 1000;
    let alpha = 0.35;
    if (this.age > fadeStart) {
      alpha *= 1 - (this.age - fadeStart) / 1000;
    }

    // Main puddle
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(41, 182, 246, 0.3)';
    ctx.fill();

    // Ripple rings
    for (let i = 0; i < 3; i++) {
      const rippleProgress = ((this.ripplePhase + i * 2) % 6) / 6;
      const rippleRadius = this.radius * 0.3 + this.radius * 0.7 * rippleProgress;
      const rippleAlpha = alpha * (1 - rippleProgress) * 0.5;

      ctx.globalAlpha = rippleAlpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, rippleRadius, 0, Math.PI * 2);
      ctx.strokeStyle = '#4fc3f7';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  reset() {
    this.active = false;
    this.timeLeft = 0;
    this.age = 0;
  }
}

export default WaterPuddle;
