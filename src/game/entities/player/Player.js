import Entity from '../Entity.js';

class Player extends Entity {
  constructor({ x, y }) {
    super({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 16,
      type: 'player',
      color: '#7eb8da' // Cyan-blue
    });

    this.speed = 250; // px/sec
    this.maxHp = 100;
    this.hp = 100;

    // Movement direction set by GameEngine based on WASD input
    this.moveDirection = { x: 0, y: 0 };

    // Invincibility frames (i-frames) after taking damage
    this.invincible = false;
    this.invincibilityDuration = 1000; // ms
    this.invincibilityTimer = 0;

    // Hit flash effect
    this.hitFlash = false;
    this.hitFlashDuration = 200; // ms
    this.hitFlashTimer = 0;

    // Canvas bounds for clamping
    this.canvasWidth = 0;
    this.canvasHeight = 0;
  }

  setCanvasSize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  takeDamage(amount) {
    // No damage during i-frames
    if (this.invincible) return;

    this.hp = Math.max(0, this.hp - amount);

    // Activate i-frames
    this.invincible = true;
    this.invincibilityTimer = 0;

    // Activate hit flash
    this.hitFlash = true;
    this.hitFlashTimer = 0;

    console.log(`Player took ${amount} damage. HP: ${this.hp}/${this.maxHp}`);

    if (this.hp <= 0) {
      console.log('Player died!');
      // TODO: Game over logic
    }
  }

  update(dt) {
    // Normalize diagonal movement (prevent faster diagonal speed)
    const dirLength = Math.sqrt(
      this.moveDirection.x * this.moveDirection.x +
      this.moveDirection.y * this.moveDirection.y
    );

    if (dirLength > 0) {
      const normalizedX = this.moveDirection.x / dirLength;
      const normalizedY = this.moveDirection.y / dirLength;

      this.vx = normalizedX * this.speed;
      this.vy = normalizedY * this.speed;
    } else {
      this.vx = 0;
      this.vy = 0;
    }

    // Apply movement
    super.update(dt);

    // Clamp to canvas bounds
    if (this.canvasWidth > 0 && this.canvasHeight > 0) {
      this.x = Math.max(this.size, Math.min(this.canvasWidth - this.size, this.x));
      this.y = Math.max(this.size, Math.min(this.canvasHeight - this.size, this.y));
    }

    // Update i-frames timer
    if (this.invincible) {
      this.invincibilityTimer += dt * 1000;
      if (this.invincibilityTimer >= this.invincibilityDuration) {
        this.invincible = false;
        this.invincibilityTimer = 0;
      }
    }

    // Update hit flash timer
    if (this.hitFlash) {
      this.hitFlashTimer += dt * 1000;
      if (this.hitFlashTimer >= this.hitFlashDuration) {
        this.hitFlash = false;
        this.hitFlashTimer = 0;
      }
    }
  }

  render(ctx) {
    if (!this.active) return;

    ctx.save();

    // Invincibility flicker effect (rapid flashing)
    if (this.invincible) {
      const flickerFrequency = 100; // ms per flicker cycle
      const flickerCycle = Math.floor(this.invincibilityTimer / flickerFrequency);
      if (flickerCycle % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }
    }

    // Hit flash effect (white flash)
    let renderColor = this.color;
    if (this.hitFlash) {
      renderColor = '#ffffff';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ffffff';
    } else {
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.color;
    }

    // Draw player circle
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = renderColor;
    ctx.fill();

    ctx.restore();
  }
}

export default Player;
