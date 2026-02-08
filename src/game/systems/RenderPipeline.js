import { useGameStore } from '../../stores/gameStore.js';
import { MATERIAL_CONFIG } from '../data/materialConfig.js';
import { CRAFTED_SPELL_CONFIG } from '../data/craftedSpellConfig.js';

class RenderPipeline {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  render(ctx, entityManager, inputSystem, interpolation, gestureUI, player, enemyPools, waveSpawner, materialDropPool, craftedSpellCaster, camera, wallSystem, structurePool) {
    // Layer 1: Background (already cleared by engine with #0a0a12)

    // --- World-space layers (camera transform applied) ---
    if (camera) camera.applyTransform(ctx);

    // World boundary walls
    if (camera) this.renderBoundary(ctx, camera);

    // Interior walls
    if (wallSystem) wallSystem.render(ctx);

    // Structures (below entities)
    if (structurePool) structurePool.render(ctx);

    // Layer 2: Game entities (projectiles, explosions)
    entityManager.render(ctx, interpolation);

    // Layer 3: Player
    if (player) {
      player.render(ctx);
    }

    // Layer 4: Enemies (render all pools)
    if (enemyPools) {
      for (const key in enemyPools) {
        enemyPools[key].render(ctx);
      }
    }

    // Layer 5: Material drops
    if (materialDropPool) {
      materialDropPool.render(ctx);
    }

    // Layer 6: Crafted spell effects
    if (craftedSpellCaster) {
      craftedSpellCaster.render(ctx);
    }

    // Layer 7: Drawing trail (renders above entities, in world space)
    inputSystem.render(ctx);

    if (camera) camera.restore(ctx);

    // --- Screen-space layers (no camera transform) ---

    // Layer 8: UI overlays
    if (gestureUI) {
      gestureUI.render(ctx, ctx.canvas.width, ctx.canvas.height);
    }

    // Layer 9: HUD (HP bar, mana bar, wave counter, material inventory, spell slots)
    if (player) {
      this.renderHUD(ctx, player, waveSpawner, craftedSpellCaster, structurePool);
    }

    // Minimap
    if (camera && player) {
      this.renderMinimap(ctx, camera, player, enemyPools, wallSystem, structurePool);
    }
  }

  renderBoundary(ctx, camera) {
    const ww = camera.worldWidth;
    const wh = camera.worldHeight;
    const thickness = 30;
    const time = Date.now() / 1000;
    const pulse = 0.5 + 0.3 * Math.sin(time * 2);

    ctx.save();

    // Glowing teal/cyan energy walls with inner gradient
    const wallColor = `rgba(0, 220, 220, ${0.15 * pulse})`;
    const edgeColor = `rgba(0, 255, 255, ${0.6 * pulse})`;

    // Top wall
    const topGrad = ctx.createLinearGradient(0, 0, 0, thickness);
    topGrad.addColorStop(0, edgeColor);
    topGrad.addColorStop(1, 'rgba(0, 220, 220, 0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, ww, thickness);

    // Bottom wall
    const botGrad = ctx.createLinearGradient(0, wh, 0, wh - thickness);
    botGrad.addColorStop(0, edgeColor);
    botGrad.addColorStop(1, 'rgba(0, 220, 220, 0)');
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, wh - thickness, ww, thickness);

    // Left wall
    const leftGrad = ctx.createLinearGradient(0, 0, thickness, 0);
    leftGrad.addColorStop(0, edgeColor);
    leftGrad.addColorStop(1, 'rgba(0, 220, 220, 0)');
    ctx.fillStyle = leftGrad;
    ctx.fillRect(0, 0, thickness, wh);

    // Right wall
    const rightGrad = ctx.createLinearGradient(ww, 0, ww - thickness, 0);
    rightGrad.addColorStop(0, edgeColor);
    rightGrad.addColorStop(1, 'rgba(0, 220, 220, 0)');
    ctx.fillStyle = rightGrad;
    ctx.fillRect(ww - thickness, 0, thickness, wh);

    // Thin bright edge lines
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
    ctx.strokeRect(1, 1, ww - 2, wh - 2);

    ctx.restore();
  }

  renderHUD(ctx, player, waveSpawner, craftedSpellCaster, structurePool) {
    // HP bar in top-left corner
    const barWidth = 200;
    const barHeight = 12;
    const barX = 10;
    const barY = 70; // Below Back to Menu button

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
    ctx.fillText(`HP: ${Math.ceil(player.hp)}/${player.maxHp}`, barX + 5, barY + 10);

    // Mana bar below HP bar
    const manaBarY = barY + barHeight + 4;
    const manaBarHeight = 8;
    const manaPercent = player.mana / player.maxMana;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX, manaBarY, barWidth, manaBarHeight);

    ctx.fillStyle = '#42a5f5';
    ctx.fillRect(barX, manaBarY, barWidth * manaPercent, manaBarHeight);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '10px monospace';
    ctx.fillText(`MP: ${Math.ceil(player.mana)}/${player.maxMana}`, barX + 5, manaBarY + 7);

    // Material inventory (bottom-left)
    this.renderMaterialInventory(ctx);

    // Equipped crafted spell slots (bottom-center)
    this.renderSpellSlots(ctx, craftedSpellCaster);

    // Floating pickup texts
    this.renderPickupTexts(ctx);

    // Tab hint
    ctx.fillStyle = 'rgba(126, 184, 218, 0.5)';
    ctx.font = '11px monospace';
    ctx.fillText('[Tab] Spell Forge', barX, manaBarY + manaBarHeight + 16);

    // Structure build / repair panel (slides in from right)
    if (structurePool) {
      this.renderStructurePanel(ctx, player, structurePool);
    }

    // Wave display (top-right corner)
    if (waveSpawner) {
      const waveNum = waveSpawner.getCurrentWave();
      const waveState = waveSpawner.getWaveState();
      const enemyCount = waveSpawner.getActiveEnemyCount();

      ctx.save();

      // Position top-right, below the React FPS/Entities overlay
      const waveX = ctx.canvas.width - 120;
      const waveY = 60;

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

  renderMinimap(ctx, camera, player, enemyPools, wallSystem, structurePool) {
    const mapSize = 160;
    const padding = 10;
    const mapX = ctx.canvas.width - mapSize - padding;
    const mapY = ctx.canvas.height - mapSize - padding;
    const scaleX = mapSize / camera.worldWidth;
    const scaleY = mapSize / camera.worldHeight;

    ctx.save();

    // Background
    ctx.fillStyle = 'rgba(5, 8, 15, 0.7)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);

    // Border
    ctx.strokeStyle = 'rgba(126, 184, 218, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);

    // Walls
    if (wallSystem) {
      ctx.fillStyle = 'rgba(80, 140, 255, 0.4)';
      for (const wall of wallSystem.getWalls()) {
        ctx.fillRect(
          mapX + wall.x * scaleX,
          mapY + wall.y * scaleY,
          Math.max(1, wall.w * scaleX),
          Math.max(1, wall.h * scaleY)
        );
      }
    }

    // Structures (colored diamonds)
    if (structurePool) {
      for (const s of structurePool.getActive()) {
        const sx = mapX + s.x * scaleX;
        const sy = mapY + s.y * scaleY;
        ctx.fillStyle = s.config.color;
        ctx.beginPath();
        ctx.moveTo(sx, sy - 3);
        ctx.lineTo(sx + 3, sy);
        ctx.lineTo(sx, sy + 3);
        ctx.lineTo(sx - 3, sy);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Enemies (small red dots)
    if (enemyPools) {
      ctx.fillStyle = 'rgba(244, 67, 54, 0.8)';
      for (const key in enemyPools) {
        for (const enemy of enemyPools[key].getActive()) {
          if (!enemy.active) continue;
          const ex = mapX + enemy.x * scaleX;
          const ey = mapY + enemy.y * scaleY;
          ctx.fillRect(ex - 1, ey - 1, 2, 2);
        }
      }
    }

    // Viewport rectangle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      mapX + camera.x * scaleX,
      mapY + camera.y * scaleY,
      camera.viewWidth * scaleX,
      camera.viewHeight * scaleY
    );

    // Player (bright cyan dot with glow)
    const px = mapX + player.x * scaleX;
    const py = mapY + player.y * scaleY;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#7eb8da';
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#7eb8da';
    ctx.fill();

    ctx.restore();
  }

  renderMaterialIcon(ctx, key, x, y, s) {
    const mat = MATERIAL_CONFIG[key];
    if (!mat) return;

    ctx.save();
    ctx.shadowBlur = 4;
    ctx.shadowColor = mat.color;

    if (key === 'mirrorShard') {
      // Crystal shard polygon
      ctx.beginPath();
      ctx.moveTo(x + s * 0.5, y + s * 0.06);
      ctx.lineTo(x + s * 0.875, y + s * 0.375);
      ctx.lineTo(x + s * 0.69, y + s * 0.94);
      ctx.lineTo(x + s * 0.31, y + s * 0.94);
      ctx.lineTo(x + s * 0.125, y + s * 0.375);
      ctx.closePath();
      ctx.fillStyle = mat.color;
      ctx.globalAlpha = 0.9;
      ctx.fill();
      // Highlight
      ctx.beginPath();
      ctx.moveTo(x + s * 0.5, y + s * 0.19);
      ctx.lineTo(x + s * 0.75, y + s * 0.41);
      ctx.lineTo(x + s * 0.63, y + s * 0.81);
      ctx.lineTo(x + s * 0.38, y + s * 0.81);
      ctx.lineTo(x + s * 0.25, y + s * 0.41);
      ctx.closePath();
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.25;
      ctx.fill();
    } else if (key === 'voidCore') {
      // Concentric circles
      ctx.beginPath();
      ctx.arc(x + s / 2, y + s / 2, s * 0.38, 0, Math.PI * 2);
      ctx.fillStyle = '#0d0d1a';
      ctx.globalAlpha = 1;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s / 2, y + s / 2, s * 0.31, 0, Math.PI * 2);
      ctx.strokeStyle = '#4a148c';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.8;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + s / 2, y + s / 2, s * 0.19, 0, Math.PI * 2);
      ctx.strokeStyle = '#7c4dff';
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + s / 2, y + s / 2, s * 0.09, 0, Math.PI * 2);
      ctx.fillStyle = '#7c4dff';
      ctx.globalAlpha = 0.4;
      ctx.fill();
    } else if (key === 'etherWisp') {
      // Wispy ellipses
      ctx.save();
      ctx.translate(x + s / 2, y + s / 2);
      ctx.rotate(-0.35);
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.31, s * 0.19, 0, 0, Math.PI * 2);
      ctx.fillStyle = mat.color;
      ctx.globalAlpha = 0.5;
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.translate(x + s / 2, y + s / 2);
      ctx.rotate(0.52);
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.19, s * 0.31, 0, 0, Math.PI * 2);
      ctx.fillStyle = mat.color;
      ctx.globalAlpha = 0.3;
      ctx.fill();
      ctx.restore();
      ctx.beginPath();
      ctx.arc(x + s / 2, y + s / 2, s * 0.13, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.6;
      ctx.fill();
    } else if (key === 'portalStone') {
      // Rotated diamond
      ctx.save();
      ctx.translate(x + s / 2, y + s / 2);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = mat.color;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(-s * 0.25, -s * 0.25, s * 0.5, s * 0.5);
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.15;
      ctx.fillRect(-s * 0.16, -s * 0.16, s * 0.31, s * 0.31);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(x + s / 2, y + s / 2, s * 0.09, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.4;
      ctx.fill();
    } else if (key === 'hexThread') {
      // Wavy thread
      ctx.beginPath();
      ctx.moveTo(x + s * 0.19, y + s * 0.75);
      ctx.quadraticCurveTo(x + s * 0.31, y + s * 0.25, x + s * 0.5, y + s * 0.5);
      ctx.quadraticCurveTo(x + s * 0.69, y + s * 0.75, x + s * 0.81, y + s * 0.25);
      ctx.strokeStyle = mat.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;
      ctx.stroke();
      // White highlight stroke
      ctx.beginPath();
      ctx.moveTo(x + s * 0.19, y + s * 0.75);
      ctx.quadraticCurveTo(x + s * 0.31, y + s * 0.25, x + s * 0.5, y + s * 0.5);
      ctx.quadraticCurveTo(x + s * 0.69, y + s * 0.75, x + s * 0.81, y + s * 0.25);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + s / 2, y + s / 2, s * 0.06, 0, Math.PI * 2);
      ctx.fillStyle = mat.color;
      ctx.globalAlpha = 0.6;
      ctx.fill();
    }

    ctx.restore();
  }

  renderMaterialInventory(ctx) {
    const store = useGameStore.getState();
    const inventory = store.inventory;
    const startX = 10;
    const startY = ctx.canvas.height - 44;
    const iconSize = 16;

    ctx.save();
    ctx.font = '11px monospace';

    let offsetX = 0;
    for (const key of Object.keys(MATERIAL_CONFIG)) {
      const count = inventory[key] || 0;

      // Draw material icon (SVG-style canvas rendering)
      this.renderMaterialIcon(ctx, key, startX + offsetX, startY, iconSize);

      // Count
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.fillStyle = count > 0 ? '#f4e8c1' : '#555';
      ctx.fillText(count.toString(), startX + offsetX + iconSize + 2, startY + iconSize - 4);

      offsetX += 38;
    }

    ctx.restore();
  }

  renderStructurePanel(ctx, player, structurePool) {
    const store = useGameStore.getState();
    const inventory = store.inventory;

    // Check for nearby unbuilt structure
    const unbuilt = structurePool.getNearestUnbuiltInRange(player.x, player.y, 60);
    if (unbuilt) {
      const panelW = 200;
      const panelH = 90;
      const panelX = ctx.canvas.width - panelW - 15;
      const panelY = ctx.canvas.height / 2 - panelH / 2;

      ctx.save();

      // Panel background
      ctx.fillStyle = 'rgba(10, 12, 25, 0.85)';
      ctx.strokeStyle = unbuilt.config.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(panelX, panelY, panelW, panelH, 6);
      ctx.fill();
      ctx.shadowBlur = 8;
      ctx.shadowColor = unbuilt.config.color;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Title
      ctx.fillStyle = unbuilt.config.color;
      ctx.font = 'bold 12px monospace';
      ctx.fillText(unbuilt.config.name, panelX + 10, panelY + 18);

      // Build cost
      ctx.font = '10px monospace';
      ctx.fillStyle = '#aaa';
      ctx.fillText('Cost:', panelX + 10, panelY + 34);

      let costX = panelX + 42;
      let canAfford = true;
      const cost = unbuilt.config.buildCost;
      for (const [mat, count] of Object.entries(cost)) {
        const have = inventory[mat] || 0;
        const enough = have >= count;
        if (!enough) canAfford = false;

        // Material icon (small)
        this.renderMaterialIcon(ctx, mat, costX, panelY + 24, 12);
        costX += 14;

        // Count text
        ctx.globalAlpha = 1;
        ctx.fillStyle = enough ? '#4caf50' : '#f44336';
        ctx.fillText(`${have}/${count}`, costX, panelY + 34);
        costX += 32;
      }

      // Build prompt
      ctx.font = '13px monospace';
      if (canAfford) {
        ctx.fillStyle = 'rgba(255, 200, 50, 0.95)';
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(255, 200, 50, 0.5)';
        ctx.fillText('[E] Build', panelX + 10, panelY + panelH - 14);
      } else {
        ctx.fillStyle = 'rgba(150, 150, 150, 0.6)';
        ctx.fillText('Not enough materials', panelX + 10, panelY + panelH - 14);
      }

      ctx.restore();
      return;
    }

    // Check for nearby damaged built structure
    const damaged = structurePool.getNearestDamagedInRange(player.x, player.y, 60);
    if (damaged) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 200, 50, 0.9)';
      ctx.font = '14px monospace';
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(255, 200, 50, 0.6)';
      ctx.fillText('[E] Repair', ctx.canvas.width / 2 - 40, ctx.canvas.height / 2 + 40);
      ctx.restore();
    }
  }

  renderSpellSlots(ctx, craftedSpellCaster) {
    const store = useGameStore.getState();
    const equipped = store.equippedCrafted;
    const centerX = ctx.canvas.width / 2;
    const slotY = ctx.canvas.height - 50;
    const slotSize = 36;
    const gap = 10;

    ctx.save();

    for (let i = 0; i < 2; i++) {
      const x = centerX - (slotSize + gap / 2) + i * (slotSize + gap);
      const spellId = equipped[i];

      // Slot background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.strokeStyle = spellId ? 'rgba(212, 165, 116, 0.6)' : 'rgba(126, 184, 218, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, slotY, slotSize, slotSize, 4);
      ctx.fill();
      ctx.stroke();

      // Key label
      ctx.fillStyle = 'rgba(126, 184, 218, 0.6)';
      ctx.font = '10px monospace';
      ctx.fillText(`${i + 1}`, x + 2, slotY + 10);

      if (spellId) {
        const config = CRAFTED_SPELL_CONFIG[spellId];
        if (config) {
          // Spell name (abbreviated)
          ctx.fillStyle = '#f4e8c1';
          ctx.font = '9px monospace';
          const abbrev = config.name.substring(0, 5);
          ctx.fillText(abbrev, x + 3, slotY + 24);

          // Cooldown overlay
          if (craftedSpellCaster) {
            const cdPercent = craftedSpellCaster.getCooldownPercent(spellId);
            if (cdPercent > 0) {
              ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
              ctx.fillRect(x, slotY, slotSize, slotSize * cdPercent);

              ctx.fillStyle = '#f44336';
              ctx.font = '10px monospace';
              const cdTime = (craftedSpellCaster.cooldowns[spellId] / 1000).toFixed(1);
              ctx.fillText(`${cdTime}s`, x + 3, slotY + 34);
            }
          }
        }
      }
    }

    ctx.restore();
  }

  renderPickupTexts(ctx) {
    const store = useGameStore.getState();
    const texts = store.pickupTexts;
    const now = Date.now();

    ctx.save();
    ctx.font = '12px monospace';

    for (const text of texts) {
      const age = now - text.time;
      if (age > 2000) {
        store.clearPickupText(text.id);
        continue;
      }

      const alpha = Math.max(0, 1 - age / 2000);
      const yOffset = -age / 40;
      const matConfig = MATERIAL_CONFIG[text.type];

      ctx.globalAlpha = alpha;
      ctx.fillStyle = matConfig ? matConfig.color : '#ffffff';
      ctx.shadowBlur = 5;
      ctx.shadowColor = matConfig ? matConfig.color : '#ffffff';
      ctx.fillText(
        `+${text.count} ${matConfig ? matConfig.name : text.type}`,
        ctx.canvas.width / 2 - 50,
        ctx.canvas.height / 2 + yOffset - 40
      );
    }

    ctx.restore();
  }
}

export default RenderPipeline;
