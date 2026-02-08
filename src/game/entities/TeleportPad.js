class TeleportPad {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 30;
    this.active = true;
    this.pulsePhase = 0;
    this.rotationAngle = 0;
    this.particles = [];
  }

  update(dt) {
    this.pulsePhase += dt * 3;
    this.rotationAngle += dt * 1.5;

    // Portal particles (reduced for perf)
    if (Math.random() < 0.25) {
      const angle = Math.random() * Math.PI * 2;
      const dist = this.size * 0.3 + Math.random() * this.size * 0.7;
      this.particles.push({
        x: this.x + Math.cos(angle) * dist,
        y: this.y + Math.sin(angle) * dist,
        vy: -30 - Math.random() * 20,
        vx: (Math.random() - 0.5) * 15,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 0.6 + Math.random() * 0.4,
        size: 1 + Math.random() * 2,
      });
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  isPlayerInRange(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    return dx * dx + dy * dy < (this.size + player.size) * (this.size + player.size);
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();

    const pulse = 0.5 + 0.3 * Math.sin(this.pulsePhase);

    // Particles
    for (const p of this.particles) {
      const alpha = (p.life / p.maxLife) * 0.6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(124, 77, 255, ${alpha})`;
      ctx.fill();
    }

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size + 5, 0, Math.PI * 2);
    const outerGrad = ctx.createRadialGradient(
      this.x, this.y, this.size * 0.5,
      this.x, this.y, this.size + 5
    );
    outerGrad.addColorStop(0, `rgba(124, 77, 255, ${0.2 * pulse})`);
    outerGrad.addColorStop(1, 'rgba(124, 77, 255, 0)');
    ctx.fillStyle = outerGrad;
    ctx.fill();

    // Portal circle
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(20, 10, 40, 0.8)';
    ctx.fill();

    // Spinning rings
    ctx.strokeStyle = `rgba(124, 77, 255, ${0.5 + pulse * 0.3})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const r = this.size * (0.4 + i * 0.2);
      const startAngle = this.rotationAngle + i * Math.PI / 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, startAngle, startAngle + Math.PI);
      ctx.stroke();
    }

    // Center vortex
    const vortexGrad = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.size * 0.4
    );
    vortexGrad.addColorStop(0, `rgba(179, 136, 255, ${0.6 + pulse * 0.3})`);
    vortexGrad.addColorStop(1, 'rgba(124, 77, 255, 0)');
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = vortexGrad;
    ctx.fill();

    // Border
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(179, 136, 255, ${0.6 + pulse * 0.2})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }
}

export default TeleportPad;
