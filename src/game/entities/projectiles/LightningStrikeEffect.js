class LightningStrikeEffect {
  constructor() {
    this.bolts = []; // { segments, target, alpha, timer }
    this.duration = 500; // ms
  }

  strike(targets, camera, damageModifier = 1.0) {
    for (const target of targets) {
      // Generate jagged bolt from sky to target
      const startX = target.x + (Math.random() - 0.5) * 20;
      const startY = camera ? camera.y - 20 : target.y - 400;
      const endX = target.x;
      const endY = target.y;

      const segments = this.generateBoltSegments(startX, startY, endX, endY);

      this.bolts.push({
        segments,
        targetX: endX,
        targetY: endY,
        alpha: 1.0,
        timer: 0,
        duration: this.duration
      });
    }
  }

  generateBoltSegments(x1, y1, x2, y2) {
    const segments = [];
    const numSegments = 8 + Math.floor(Math.random() * 6);
    let prevX = x1;
    let prevY = y1;

    for (let i = 1; i <= numSegments; i++) {
      const t = i / numSegments;
      let nx = x1 + (x2 - x1) * t;
      let ny = y1 + (y2 - y1) * t;

      // Add zigzag jitter (less at start and end)
      if (i < numSegments) {
        const jitter = 30 * Math.sin(t * Math.PI); // max jitter in middle
        nx += (Math.random() - 0.5) * jitter * 2;
        ny += (Math.random() - 0.5) * jitter * 0.5;
      }

      segments.push({ x1: prevX, y1: prevY, x2: nx, y2: ny });
      prevX = nx;
      prevY = ny;
    }

    return segments;
  }

  update(dt) {
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const bolt = this.bolts[i];
      bolt.timer += dt * 1000;
      bolt.alpha = 1.0 - bolt.timer / bolt.duration;

      if (bolt.timer >= bolt.duration) {
        this.bolts.splice(i, 1);
      }
    }
  }

  render(ctx) {
    if (this.bolts.length === 0) return;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const bolt of this.bolts) {
      if (bolt.alpha <= 0) continue;

      // Outer glow
      ctx.strokeStyle = `rgba(255, 235, 59, ${bolt.alpha * 0.4})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      for (const seg of bolt.segments) {
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
      }
      ctx.stroke();

      // Inner bright line
      ctx.strokeStyle = `rgba(255, 255, 255, ${bolt.alpha * 0.9})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const seg of bolt.segments) {
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
      }
      ctx.stroke();

      // Impact flash at target
      if (bolt.timer < 150) {
        const flashAlpha = bolt.alpha * 0.6;
        ctx.beginPath();
        ctx.arc(bolt.targetX, bolt.targetY, 20 + Math.random() * 10, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 235, 59, ${flashAlpha})`;
        ctx.fill();
      }
    }

    ctx.restore();
  }

  getActive() {
    return this.bolts;
  }
}

export default LightningStrikeEffect;
