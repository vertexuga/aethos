class RenderPipeline {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  render(ctx, entityManager, inputSystem, interpolation, gestureUI, player, enemyPool, waveSpawner) {
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

    // Layer 7: HUD (HP bar, wave counter, etc.)
    if (player) {
      this.renderHUD(ctx, player, waveSpawner);
    }
  }

  renderHUD(ctx, player, waveSpawner) {
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

    // Wave display (top-right corner)
    if (waveSpawner) {
      const waveNum = waveSpawner.getCurrentWave();
      const waveState = waveSpawner.getWaveState();
      const enemyCount = waveSpawner.getActiveEnemyCount();

      ctx.save();

      // Position top-right
      const waveX = ctx.canvas.width - 120;
      const waveY = 20;

      // Wave state-specific display
      if (waveState === 'waiting') {
        // Pulsing alpha for "incoming" message
        const time = Date.now() / 1000;
        const alpha = 0.5 + 0.3 * Math.sin(time * 3);

        ctx.fillStyle = `rgba(126, 184, 218, ${alpha})`;
        ctx.font = '16px monospace';
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'rgba(126, 184, 218, 0.8)';
        ctx.fillText(`Wave ${waveNum}`, waveX, waveY);
        ctx.fillText(`incoming...`, waveX, waveY + 20);
      } else if (waveState === 'cleared') {
        // Flash "Wave Cleared!" in gold
        ctx.fillStyle = '#d4a574';
        ctx.font = 'bold 18px monospace';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#d4a574';
        ctx.fillText('Wave Cleared!', waveX - 20, waveY + 10);
      } else {
        // Normal display (spawning or active)
        ctx.fillStyle = 'rgba(126, 184, 218, 0.8)';
        ctx.font = '16px monospace';
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'rgba(126, 184, 218, 0.8)';
        ctx.fillText(`Wave ${waveNum}`, waveX, waveY);

        // Enemy count
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '14px monospace';
        ctx.shadowBlur = 0;
        ctx.fillText(`Enemies: ${enemyCount}`, waveX, waveY + 20);
      }

      ctx.restore();
    }
  }
}

export default RenderPipeline;
