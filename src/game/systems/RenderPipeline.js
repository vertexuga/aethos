import { useGameStore } from '../../stores/gameStore.js';
import { MATERIAL_CONFIG } from '../data/materialConfig.js';
import { CRAFTED_SPELL_CONFIG } from '../data/craftedSpellConfig.js';

class RenderPipeline {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.screenMouseX = -1;
    this.screenMouseY = -1;
  }

  render(ctx, entityManager, inputSystem, interpolation, gestureUI, player, enemyPools, waveSpawner, materialDropPool, craftedSpellCaster, camera, wallSystem, structurePool, accessorySystem, crystal, teleportPad, zoneManager, spellCaster) {
    this._wallSystem = wallSystem; // cache for HUD rendering
    this._teleportPad = teleportPad;
    this._zoneManager = zoneManager;
    this._player = player;
    this._camera = camera;
    // Layer 1: Background (already cleared by engine with #0a0a12)

    // --- World-space layers (camera transform applied) ---
    if (camera) camera.applyTransform(ctx);

    // World boundary walls
    if (camera) this.renderBoundary(ctx, camera);

    // Interior walls
    if (wallSystem) wallSystem.render(ctx, camera);

    // Structures (below entities, base only)
    if (structurePool && (!zoneManager || zoneManager.isInBase())) structurePool.render(ctx);

    // Crystal (base defense target)
    if (crystal && (!zoneManager || zoneManager.isInBase())) crystal.render(ctx);

    // Teleport pad
    if (teleportPad && (!zoneManager || zoneManager.isInBase())) teleportPad.render(ctx);

    // Dungeon loot chests
    if (zoneManager && zoneManager.isInDungeon()) {
      for (const chest of zoneManager.dungeonLootChests) {
        if (chest.active) chest.render(ctx);
      }
    }

    // Dungeon floor portal (pulsing spiral in boss room)
    if (this._dungeonPortalActive && this._dungeonBossRoom) {
      const px = this._dungeonBossRoom.cx;
      const py = this._dungeonBossRoom.cy;
      const t = Date.now() / 1000;

      // Outer glow
      const glowRadius = 35 + Math.sin(t * 2) * 5;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, glowRadius);
      grad.addColorStop(0, 'rgba(179, 136, 255, 0.4)');
      grad.addColorStop(0.6, 'rgba(124, 77, 255, 0.15)');
      grad.addColorStop(1, 'rgba(124, 77, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Rotating ring
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(t * 1.5);
      ctx.strokeStyle = 'rgba(179, 136, 255, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 1.5);
      ctx.stroke();
      ctx.rotate(-t * 3);
      ctx.strokeStyle = 'rgba(124, 77, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 1.2);
      ctx.stroke();
      ctx.restore();

      // Center diamond
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(t);
      const ds = 6 + Math.sin(t * 3) * 2;
      ctx.beginPath();
      ctx.moveTo(0, -ds);
      ctx.lineTo(ds, 0);
      ctx.lineTo(0, ds);
      ctx.lineTo(-ds, 0);
      ctx.closePath();
      ctx.fillStyle = 'rgba(179, 136, 255, 0.9)';
      ctx.fill();
      ctx.restore();
    }

    // Water puddles (ground effect, below entities)
    if (spellCaster) {
      const puddles = spellCaster.getActivePuddles();
      for (const puddle of puddles) {
        puddle.render(ctx);
      }
    }

    // Layer 2: Game entities (projectiles, explosions)
    entityManager.render(ctx, interpolation);

    // Layer 3: Player
    if (player) {
      player.render(ctx);
    }

    // Layer 4: Enemies (render all pools)
    if (enemyPools) {
      for (const key in enemyPools) {
        enemyPools[key].render(ctx, interpolation);
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

    // Layer 6b: Accessory world effects (fire trail, puddles, guardians, barrier)
    if (accessorySystem) {
      accessorySystem.renderWorldEffects(ctx);
    }

    // Lightning bolt effects (above entities, world space)
    if (spellCaster) {
      spellCaster.getLightningEffect().render(ctx);
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

    // Accessory HUD (above material inventory)
    if (accessorySystem) {
      accessorySystem.setMousePos(this.screenMouseX, this.screenMouseY);
      accessorySystem.renderAccessoryHUD(ctx);
    }

    // Crystal HUD HP bar (always visible, below player HP/mana)
    if (crystal) {
      this.renderCrystalHUD(ctx, crystal);
    }

    // Crystal under attack warning (flashing vignette + text when in dungeon)
    if (crystal && crystal.isUnderAttack && this._zoneManager && this._zoneManager.isInDungeon()) {
      const flashAlpha = 0.08 + 0.08 * Math.sin(Date.now() / 200);
      ctx.fillStyle = `rgba(255, 30, 30, ${flashAlpha})`;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      ctx.save();
      ctx.fillStyle = `rgba(255, 60, 60, ${0.6 + 0.3 * Math.sin(Date.now() / 250)})`;
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CRYSTAL UNDER ATTACK!', ctx.canvas.width / 2, 40);
      ctx.textAlign = 'left';
      ctx.restore();
    }

    // Crystal low HP critical warning (all zones)
    if (crystal && crystal.isLowHP && crystal.active) {
      const flashAlpha = 0.12 + 0.12 * Math.sin(Date.now() / 150);
      // Red vignette overlay
      const vignetteGrad = ctx.createRadialGradient(
        ctx.canvas.width / 2, ctx.canvas.height / 2, ctx.canvas.width * 0.2,
        ctx.canvas.width / 2, ctx.canvas.height / 2, ctx.canvas.width * 0.7
      );
      vignetteGrad.addColorStop(0, 'rgba(255, 0, 0, 0)');
      vignetteGrad.addColorStop(1, `rgba(255, 0, 0, ${flashAlpha})`);
      ctx.fillStyle = vignetteGrad;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      // "CRYSTAL HP CRITICAL!" text
      ctx.save();
      ctx.fillStyle = `rgba(255, 40, 40, ${0.7 + 0.3 * Math.sin(Date.now() / 120)})`;
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CRYSTAL HP CRITICAL!', ctx.canvas.width / 2, 60);
      ctx.textAlign = 'left';
      ctx.restore();
    }

    // Player respawn overlay
    if (this.playerRespawning) {
      // Dark overlay
      ctx.fillStyle = 'rgba(5, 5, 15, 0.6)';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      ctx.save();
      ctx.textAlign = 'center';

      // "Respawning in X..." text
      const timeLeft = Math.max(0, this.respawnTimer).toFixed(1);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(`Respawning in ${timeLeft}...`, ctx.canvas.width / 2, ctx.canvas.height / 2);

      // Subtitle
      ctx.font = '14px monospace';
      ctx.fillStyle = 'rgba(126, 184, 218, 0.7)';
      ctx.fillText('You will respawn at the crystal', ctx.canvas.width / 2, ctx.canvas.height / 2 + 30);

      ctx.textAlign = 'left';
      ctx.restore();
    }

    // Minimap
    if (camera && player) {
      this.renderMinimap(ctx, camera, player, enemyPools, wallSystem, structurePool, crystal, zoneManager);
    }
  }

  renderBoundary(ctx, camera) {
    const ww = camera.worldWidth;
    const wh = camera.worldHeight;
    const thickness = 30;
    const time = Date.now() / 1000;
    const pulse = 0.5 + 0.3 * Math.sin(time * 2);

    ctx.save();

    // Different colors for base vs dungeon
    const inDungeon = this._zoneManager && this._zoneManager.isInDungeon();
    const edgeColor = inDungeon
      ? `rgba(120, 60, 180, ${0.6 * pulse})`
      : `rgba(0, 255, 255, ${0.6 * pulse})`;
    const fadeColor = inDungeon
      ? 'rgba(100, 50, 160, 0)'
      : 'rgba(0, 220, 220, 0)';

    // Top wall
    const topGrad = ctx.createLinearGradient(0, 0, 0, thickness);
    topGrad.addColorStop(0, edgeColor);
    topGrad.addColorStop(1, fadeColor);
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, ww, thickness);

    // Bottom wall
    const botGrad = ctx.createLinearGradient(0, wh, 0, wh - thickness);
    botGrad.addColorStop(0, edgeColor);
    botGrad.addColorStop(1, fadeColor);
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, wh - thickness, ww, thickness);

    // Left wall
    const leftGrad = ctx.createLinearGradient(0, 0, thickness, 0);
    leftGrad.addColorStop(0, edgeColor);
    leftGrad.addColorStop(1, fadeColor);
    ctx.fillStyle = leftGrad;
    ctx.fillRect(0, 0, thickness, wh);

    // Right wall
    const rightGrad = ctx.createLinearGradient(ww, 0, ww - thickness, 0);
    rightGrad.addColorStop(0, edgeColor);
    rightGrad.addColorStop(1, fadeColor);
    ctx.fillStyle = rightGrad;
    ctx.fillRect(ww - thickness, 0, thickness, wh);

    // Thin bright edge lines
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, ww - 2, wh - 2);

    ctx.restore();
  }

  renderHUD(ctx, player, waveSpawner, craftedSpellCaster, structurePool) {
    // HP bar in top-left corner
    const barWidth = 200;
    const barHeight = 12;
    const barX = 10;
    const barY = 40; // Below small ESC Menu button

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

    // Zone indicator
    const store = useGameStore.getState();
    const zone = store.currentZone;
    ctx.fillStyle = zone === 'dungeon' ? 'rgba(124, 77, 255, 0.8)' : 'rgba(0, 229, 255, 0.6)';
    ctx.font = 'bold 12px monospace';
    if (zone === 'dungeon') {
      const floor = store.dungeonFloor || 1;
      ctx.fillText(`DUNGEON F${floor}`, barX, manaBarY + manaBarHeight + 30);
    } else {
      ctx.fillText('BASE', barX, manaBarY + manaBarHeight + 30);
    }

    // Crystal upgrade hint
    if (zone === 'base') {
      ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
      ctx.font = '11px monospace';
      ctx.fillText('[C] Crystal Upgrades', barX + 50, manaBarY + manaBarHeight + 30);
    }

    // Warp progress ring around player (centered on screen)
    if (store.isWarping) {
      const centerX = ctx.canvas.width / 2;
      const centerY = ctx.canvas.height / 2;
      const warpRadius = 30;
      const progress = store.warpProgress;

      // Background ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, warpRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(124, 77, 255, 0.3)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Progress ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, warpRadius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      ctx.strokeStyle = 'rgba(179, 136, 255, 0.9)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Text
      ctx.fillStyle = 'rgba(179, 136, 255, 0.9)';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('WARPING...', centerX, centerY + warpRadius + 18);
      ctx.fillText(`${(3 - progress * 3).toFixed(1)}s`, centerX, centerY + 4);
      ctx.textAlign = 'left';
    }

    // Dungeon warp hint
    if (zone === 'dungeon' && !store.isWarping) {
      ctx.fillStyle = 'rgba(179, 136, 255, 0.5)';
      ctx.font = '11px monospace';
      ctx.fillText('[V] Warp to Base', barX, manaBarY + manaBarHeight + 44);
    }

    // Loot chest prompt
    if (this._zoneManager && this._zoneManager.isInDungeon() && player) {
      for (const chest of this._zoneManager.dungeonLootChests) {
        if (!chest.active || chest.opened) continue;
        if (chest.isPlayerInRange(player)) {
          ctx.save();
          ctx.fillStyle = 'rgba(255, 215, 0, 0.95)';
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('[E] Open Chest', ctx.canvas.width / 2, ctx.canvas.height / 2 + 50);
          ctx.textAlign = 'left';
          ctx.restore();
          break;
        }
      }
    }

    // Dungeon floor portal prompt
    if (this._dungeonPortalActive && this._dungeonBossRoom && player && this._zoneManager && this._zoneManager.isInDungeon()) {
      const dx = player.x - this._dungeonBossRoom.cx;
      const dy = player.y - this._dungeonBossRoom.cy;
      if (dx * dx + dy * dy < 80 * 80) {
        ctx.save();
        ctx.fillStyle = 'rgba(179, 136, 255, 0.95)';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        const nextFloor = (useGameStore.getState().dungeonFloor || 1) + 1;
        const label = nextFloor > 5 ? '[E] Return to Base' : `[E] Descend to Floor ${nextFloor}`;
        ctx.fillText(label, ctx.canvas.width / 2, ctx.canvas.height / 2 + 50);
        ctx.textAlign = 'left';
        ctx.restore();
      }
    }

    // Teleport pad prompt
    if (this._teleportPad && player && this._zoneManager && this._zoneManager.isInBase()) {
      if (this._teleportPad.isPlayerInRange(player)) {
        ctx.save();
        ctx.fillStyle = 'rgba(179, 136, 255, 0.95)';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        const nextFloor = useGameStore.getState().dungeonFloor || 1;
        ctx.fillText(`[E] Enter Dungeon (Floor ${nextFloor})`, ctx.canvas.width / 2, ctx.canvas.height / 2 + 50);
        ctx.textAlign = 'left';
        ctx.restore();
      }
    }

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

      // Position top-right
      const waveX = ctx.canvas.width - 120;
      const waveY = 40;

      // Wave state-specific display
      if (waveState === 'waiting') {
        // Pulsing alpha for "incoming" message
        const time = Date.now() / 1000;
        const alpha = 0.5 + 0.3 * Math.sin(time * 3);

        ctx.fillStyle = `rgba(126, 184, 218, ${alpha})`;
        ctx.font = '16px monospace';
        ctx.fillText(`Wave ${waveNum}`, waveX, waveY);
        ctx.fillText(`incoming...`, waveX, waveY + 20);
      } else if (waveState === 'cooldown') {
        // Show next wave countdown
        ctx.fillStyle = 'rgba(126, 184, 218, 0.6)';
        ctx.font = '16px monospace';
        ctx.fillText(`Wave ${waveNum}`, waveX, waveY);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '12px monospace';
        ctx.fillText(`Enemies: ${enemyCount}`, waveX, waveY + 18);
      } else {
        // Normal display (spawning)
        ctx.fillStyle = 'rgba(126, 184, 218, 0.8)';
        ctx.font = '16px monospace';
        ctx.fillText(`Wave ${waveNum}`, waveX, waveY);

        // Enemy count
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '14px monospace';
        ctx.fillText(`Enemies: ${enemyCount}`, waveX, waveY + 20);
      }

      ctx.restore();
    }
  }

  renderCrystalHUD(ctx, crystal) {
    const barWidth = 200;
    const barHeight = 8;
    const barX = 10;
    const barY = 125; // Below zone/warp hints

    const hpPercent = crystal.hp / crystal.maxHp;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Crystal HP color
    let barColor;
    if (hpPercent > 0.6) barColor = '#00e5ff';
    else if (hpPercent > 0.3) barColor = '#ffc107';
    else barColor = '#f44336';

    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

    // Label
    ctx.fillStyle = 'rgba(0, 229, 255, 0.8)';
    ctx.font = '10px monospace';
    ctx.fillText(`Crystal: ${Math.ceil(crystal.hp)}/${crystal.maxHp}`, barX + 5, barY + 7);

    // Warning flash if under attack
    if (crystal.isUnderAttack) {
      const flashAlpha = 0.3 + 0.3 * Math.sin(Date.now() / 150);
      ctx.strokeStyle = `rgba(255, 50, 50, ${flashAlpha})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
    }
  }

  renderMinimap(ctx, camera, player, enemyPools, wallSystem, structurePool, crystal, zoneManager) {
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

    // Dungeon rooms (only in dungeon)
    const inDungeon = zoneManager && zoneManager.isInDungeon();
    if (inDungeon && zoneManager.dungeonData) {
      ctx.fillStyle = 'rgba(60, 40, 80, 0.5)';
      for (const room of zoneManager.dungeonData.rooms) {
        ctx.fillRect(
          mapX + room.x * scaleX,
          mapY + room.y * scaleY,
          Math.max(2, room.w * scaleX),
          Math.max(2, room.h * scaleY)
        );
      }
      // Highlight boss room in red
      const bossRoom = zoneManager.dungeonData.bossRoom;
      if (bossRoom) {
        ctx.strokeStyle = 'rgba(244, 67, 54, 0.7)';
        ctx.lineWidth = 1;
        ctx.strokeRect(
          mapX + bossRoom.x * scaleX,
          mapY + bossRoom.y * scaleY,
          Math.max(2, bossRoom.w * scaleX),
          Math.max(2, bossRoom.h * scaleY)
        );
      }
    }

    // Structures (colored diamonds, base only)
    if (structurePool && !inDungeon) {
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

    // Crystal (cyan diamond, base only)
    if (crystal && !inDungeon) {
      const crx = mapX + crystal.x * scaleX;
      const cry = mapY + crystal.y * scaleY;
      ctx.fillStyle = crystal.isUnderAttack ? '#f44336' : '#00e5ff';
      ctx.beginPath();
      ctx.moveTo(crx, cry - 4);
      ctx.lineTo(crx + 3, cry);
      ctx.lineTo(crx, cry + 3);
      ctx.lineTo(crx - 3, cry);
      ctx.closePath();
      ctx.fill();
    }

    // Dungeon loot chests on minimap (gold dots)
    if (inDungeon && zoneManager.dungeonLootChests) {
      for (const chest of zoneManager.dungeonLootChests) {
        if (!chest.active || chest.opened) continue;
        const cx = mapX + chest.x * scaleX;
        const cy = mapY + chest.y * scaleY;
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(cx - 2, cy - 2, 4, 4);
      }
    }

    // Dungeon floor portal on minimap (pulsing purple diamond)
    if (this._dungeonPortalActive && this._dungeonBossRoom && inDungeon) {
      const px = mapX + this._dungeonBossRoom.cx * scaleX;
      const py = mapY + this._dungeonBossRoom.cy * scaleY;
      const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 300);
      ctx.fillStyle = `rgba(179, 136, 255, ${pulse})`;
      ctx.beginPath();
      ctx.moveTo(px, py - 4);
      ctx.lineTo(px + 4, py);
      ctx.lineTo(px, py + 4);
      ctx.lineTo(px - 4, py);
      ctx.closePath();
      ctx.fill();
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

    // Player (bright cyan dot)
    const px = mapX + player.x * scaleX;
    const py = mapY + player.y * scaleY;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#7eb8da';
    ctx.fill();

    ctx.restore();
  }

  renderMaterialIcon(ctx, key, x, y, s) {
    const mat = MATERIAL_CONFIG[key];
    if (!mat) return;

    ctx.save();
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
    const slotWidth = 38;

    ctx.save();
    ctx.font = '11px monospace';

    let hoveredKey = null;
    let hoveredSlotX = 0;

    let offsetX = 0;
    const keys = Object.keys(MATERIAL_CONFIG);
    for (const key of keys) {
      const count = inventory[key] || 0;
      const slotX = startX + offsetX;

      // Check hover
      if (this.screenMouseX >= slotX && this.screenMouseX < slotX + slotWidth &&
          this.screenMouseY >= startY - 2 && this.screenMouseY < startY + iconSize + 4) {
        hoveredKey = key;
        hoveredSlotX = slotX;
        // Highlight background
        ctx.fillStyle = 'rgba(126, 184, 218, 0.12)';
        ctx.fillRect(slotX - 2, startY - 3, slotWidth, iconSize + 8);
      }

      // Draw material icon
      this.renderMaterialIcon(ctx, key, slotX, startY, iconSize);

      // Count
      ctx.globalAlpha = 1;
      ctx.fillStyle = count > 0 ? '#f4e8c1' : '#555';
      ctx.fillText(count.toString(), slotX + iconSize + 2, startY + iconSize - 4);

      offsetX += slotWidth;
    }

    ctx.restore();

    // Render tooltip for hovered material
    if (hoveredKey) {
      this.renderMaterialTooltip(ctx, hoveredKey, hoveredSlotX, startY);
    }
  }

  renderMaterialTooltip(ctx, key, slotX, slotY) {
    const mat = MATERIAL_CONFIG[key];
    if (!mat) return;

    const store = useGameStore.getState();
    const count = store.inventory[key] || 0;

    // Drop source mapping
    const dropSources = {
      mirrorShard: 'Spell Thief',
      voidCore: 'Gravity Well',
      etherWisp: 'Phase Wraith / Slime',
      portalStone: 'Rift Caller',
      hexThread: 'Curse Hexer',
    };

    const tipW = 180;
    const tipH = 62;
    let tipX = slotX;
    let tipY = slotY - tipH - 8;

    // Keep on screen
    if (tipX + tipW > ctx.canvas.width) tipX = ctx.canvas.width - tipW - 5;
    if (tipY < 0) tipY = slotY + 24;

    ctx.save();

    // Background
    ctx.fillStyle = 'rgba(8, 10, 22, 0.92)';
    ctx.strokeStyle = mat.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(tipX, tipY, tipW, tipH, 5);
    ctx.fill();
    ctx.stroke();

    // Name + count
    ctx.fillStyle = mat.color;
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`${mat.name}  x${count}`, tipX + 8, tipY + 15);

    // Description
    ctx.fillStyle = 'rgba(200, 200, 220, 0.7)';
    ctx.font = '9px monospace';
    ctx.fillText(mat.description.substring(0, 30), tipX + 8, tipY + 30);
    if (mat.description.length > 30) {
      ctx.fillText(mat.description.substring(30), tipX + 8, tipY + 40);
    }

    // Drop source
    ctx.fillStyle = 'rgba(150, 180, 200, 0.5)';
    ctx.font = '9px monospace';
    ctx.fillText(`Drops: ${dropSources[key] || '?'}`, tipX + 8, tipY + 55);

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
      ctx.stroke();

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
        ctx.fillText('[E] Build', panelX + 10, panelY + panelH - 14);
      } else {
        ctx.fillStyle = 'rgba(150, 150, 150, 0.6)';
        ctx.fillText('Not enough materials', panelX + 10, panelY + panelH - 14);
      }

      ctx.restore();
      return;
    }

    // Check for nearby upgradeable structure
    const upgradeable = structurePool.getNearestUpgradeableInRange(player.x, player.y, 60);
    if (upgradeable) {
      const tierLabels = { 1: 'I', 2: 'II', 3: 'III' };
      const currentLabel = tierLabels[upgradeable.tier] || upgradeable.tier;
      const nextLabel = tierLabels[upgradeable.tier + 1] || (upgradeable.tier + 1);
      ctx.save();
      ctx.fillStyle = 'rgba(255, 200, 50, 0.9)';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`[E] Upgrade ${upgradeable.config.name} (${currentLabel} → ${nextLabel})`, ctx.canvas.width / 2, ctx.canvas.height / 2 + 40);
      ctx.textAlign = 'left';
      ctx.restore();
      return;
    }

    // Check for nearby damaged built structure
    const damaged = structurePool.getNearestDamagedInRange(player.x, player.y, 60);
    if (damaged) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 200, 50, 0.9)';
      ctx.font = '14px monospace';
      ctx.fillText('[E] Repair Structure', ctx.canvas.width / 2 - 60, ctx.canvas.height / 2 + 40);
      ctx.restore();
      return;
    }

    // Check for nearby unbuilt door slot
    if (this._wallSystem) {
      const unbuiltDoor = this._wallSystem.getNearestUnbuiltDoorInRange(player.x, player.y, 80);
      if (unbuiltDoor) {
        ctx.save();
        ctx.fillStyle = 'rgba(100, 180, 255, 0.9)';
        ctx.font = '14px monospace';
        ctx.fillText('[E] Build Door', ctx.canvas.width / 2 - 50, ctx.canvas.height / 2 + 40);
        ctx.restore();
        return;
      }

      const damagedDoor = this._wallSystem.getNearestDamagedDoorInRange(player.x, player.y, 80);
      if (damagedDoor) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 200, 50, 0.9)';
        ctx.font = '14px monospace';
        ctx.fillText('[E] Repair Door', ctx.canvas.width / 2 - 50, ctx.canvas.height / 2 + 40);
        ctx.restore();
      }
    }
  }

  renderSpellSlots(ctx, craftedSpellCaster) {
    const store = useGameStore.getState();
    const equipped = store.equippedCrafted;
    const maxSlots = store.maxEquipSlots;
    const centerX = ctx.canvas.width / 2;
    const slotY = ctx.canvas.height - 50;
    const slotSize = 36;
    const gap = 10;
    const totalWidth = maxSlots * slotSize + (maxSlots - 1) * gap;

    ctx.save();

    for (let i = 0; i < maxSlots; i++) {
      const x = centerX - totalWidth / 2 + i * (slotSize + gap);
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
