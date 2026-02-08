import BaseSimulator from './BaseSimulator.js';
import DungeonGenerator from '../dungeon/DungeonGenerator.js';
import WallSystem from '../systems/WallSystem.js';
import LootChest from '../entities/LootChest.js';
import { useGameStore } from '../../stores/gameStore.js';

/**
 * ZoneManager — manages switching between base and dungeon zones.
 */
class ZoneManager {
  constructor() {
    this.activeZone = 'base'; // 'base' | 'dungeon'
    this.baseSimulator = new BaseSimulator();

    // Base zone state references (set by GameEngine)
    this.baseState = {
      wallSystem: null,
      structurePool: null,
      enemyPools: null,
      crystal: null,
      waveSpawner: null,
      camera: null,
    };

    // Dungeon zone state
    this.dungeonData = null; // Generated dungeon data
    this.dungeonWallSystem = null; // Dungeon-specific wall system
    this.dungeonLootChests = []; // Active loot chests in dungeon
  }

  setBaseState(state) {
    this.baseState = { ...this.baseState, ...state };
  }

  getActiveZone() {
    return this.activeZone;
  }

  isInBase() {
    return this.activeZone === 'base';
  }

  isInDungeon() {
    return this.activeZone === 'dungeon';
  }

  switchToZone(zone) {
    this.activeZone = zone;
    useGameStore.getState().setCurrentZone(zone);
  }

  /**
   * Generate and enter a dungeon.
   * @returns {{ spawnX, spawnY, worldWidth, worldHeight, dungeonData }}
   */
  generateAndEnterDungeon(tier = 1) {
    const seed = Date.now();
    const dungeonData = DungeonGenerator.generate(seed, tier);
    this.dungeonData = dungeonData;

    // Create dungeon wall system from generated walls
    this.dungeonWallSystem = {
      walls: dungeonData.walls,
      animTimer: 0,
      getWalls() { return this.walls; },
      update(dt) { this.animTimer += dt; },
      resolveCircleWallCollision: WallSystem.prototype.resolveCircleWallCollision,
      steerAroundWalls: WallSystem.prototype.steerAroundWalls,
      checkProjectileWallCollision: WallSystem.prototype.checkProjectileWallCollision,
      getCollidingWall: WallSystem.prototype.getCollidingWall,
      wallTakeDamage: WallSystem.prototype.wallTakeDamage,
      removeWall: WallSystem.prototype.removeWall,
      wallSlots: [],
      getNearestUnbuiltSlotInRange() { return null; },
      getNearestUnbuiltDoorInRange() { return null; },
      getNearestDamagedWallInRange() { return null; },
      getNearestDamagedDoorInRange() { return null; },
      getBuildCost() { return {}; },
      getRepairCost() { return {}; },
      render(ctx, camera) {
        const time = this.animTimer;
        const pulse = 0.5 + 0.2 * Math.sin(time * 1.8);
        ctx.save();

        // Viewport culling bounds (with margin)
        const vx = camera ? camera.x - 40 : -Infinity;
        const vy = camera ? camera.y - 40 : -Infinity;
        const vr = camera ? camera.x + camera.viewWidth + 40 : Infinity;
        const vb = camera ? camera.y + camera.viewHeight + 40 : Infinity;

        // Batch fill all visible walls
        ctx.fillStyle = 'rgba(20, 15, 30, 0.85)';
        for (const wall of this.walls) {
          if (wall.x + wall.w < vx || wall.x > vr || wall.y + wall.h < vy || wall.y > vb) continue;
          ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
        }

        // Batch stroke all visible walls (no shadow per wall)
        ctx.strokeStyle = `rgba(100, 70, 160, ${0.35 + pulse * 0.2})`;
        ctx.lineWidth = 1;
        for (const wall of this.walls) {
          if (wall.x + wall.w < vx || wall.x > vr || wall.y + wall.h < vy || wall.y > vb) continue;
          ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
        }

        ctx.restore();
      },
    };

    // Create loot chests from dungeon room data
    this.dungeonLootChests = [];
    for (const room of dungeonData.rooms) {
      if (room.lootPositions) {
        for (const pos of room.lootPositions) {
          this.dungeonLootChests.push(new LootChest(pos.x, pos.y, tier));
        }
      }
    }

    this.switchToZone('dungeon');

    return {
      spawnX: dungeonData.spawnRoom.cx,
      spawnY: dungeonData.spawnRoom.cy,
      worldWidth: dungeonData.worldWidth,
      worldHeight: dungeonData.worldHeight,
      dungeonData,
    };
  }

  exitDungeon() {
    this.dungeonData = null;
    this.dungeonWallSystem = null;
    this.dungeonLootChests = [];
    this.switchToZone('base');
  }

  /**
   * Get the active wall system for the current zone.
   */
  getActiveWallSystem() {
    if (this.activeZone === 'dungeon' && this.dungeonWallSystem) {
      return this.dungeonWallSystem;
    }
    return this.baseState.wallSystem;
  }

  /**
   * Update the background zone (base sim when in dungeon).
   */
  updateBackgroundZone(dt) {
    if (this.activeZone === 'dungeon') {
      // Simulate base in background
      this.baseSimulator.update(
        dt,
        this.baseState.enemyPools,
        this.baseState.crystal,
        this.baseState.wallSystem,
        this.baseState.structurePool
      );

      // Continue wave spawning in base
      if (this.baseState.waveSpawner) {
        this.baseState.waveSpawner.update(dt);
      }
    }
  }
}

export default ZoneManager;
