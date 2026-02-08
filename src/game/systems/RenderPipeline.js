class RenderPipeline {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  render(ctx, entityManager, inputSystem, interpolation, gestureUI, player, enemyPool) {
    // Layer 1: Background (already cleared by engine with #0a0a12)

    // Layer 2: Game entities (projectiles, explosions)
    entityManager.render(ctx, interpolation);

    // Layer 3: Player
    if (player) {
      player.render(ctx);
    }

    // Layer 4: Enemies
    if (enemyPool) {
      enemyPool.render(ctx);
    }

    // Layer 5: Drawing trail (renders above entities)
    inputSystem.render(ctx);

    // Layer 6: UI overlays
    if (gestureUI) {
      gestureUI.render(ctx, ctx.canvas.width, ctx.canvas.height);
    }

    // Layer 7: HUD (HP bar, etc.)
    if (player) {
      this.renderHUD(ctx, player);
    }
  }

  renderHUD(ctx, player) {
    // HP bar in top-left corner
    const barWidth = 200;
    const barHeight = 12;
    const barX = 10;
    const barY = 40; // Below FPS counter

    // Background (dark)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health bar color based on HP percentage
    const hpPercent = player.hp / player.maxHp;
    let barColor;
    if (hpPercent > 0.6) {
      barColor = '#4caf50'; // Green
    } else if (hpPercent > 0.3) {
      barColor = '#ffc107'; // Yellow
    } else {
      barColor = '#f44336'; // Red
    }

    // Foreground (health)
    const currentBarWidth = barWidth * hpPercent;
    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, currentBarWidth, barHeight);

    // HP text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '12px monospace';
    ctx.fillText(`HP: ${player.hp}/${player.maxHp}`, barX + 5, barY + 10);
  }
}

export default RenderPipeline;
