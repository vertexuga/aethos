import GameLoop from './GameLoop.js';
import { useGameStore } from '../../stores/gameStore.js';
import EntityManager from '../entities/EntityManager.js';
import Entity from '../entities/Entity.js';
import InputSystem from '../systems/InputSystem.js';
import RenderPipeline from '../systems/RenderPipeline.js';
import GestureRecognizer from '../systems/GestureRecognizer.js';
import GestureUI from '../systems/GestureUI.js';
import TrajectoryExtractor from '../systems/TrajectoryExtractor.js';
import KeyboardFallback from '../systems/KeyboardFallback.js';
import SpellCaster from '../systems/SpellCaster.js';
import Player from '../entities/player/Player.js';
import SlimeEnemy from '../entities/enemies/SlimeEnemy.js';
import SpellThiefEnemy from '../entities/enemies/SpellThiefEnemy.js';
import GravityWellEnemy from '../entities/enemies/GravityWellEnemy.js';
import PhaseWraithEnemy from '../entities/enemies/PhaseWraithEnemy.js';
import RiftCallerEnemy from '../entities/enemies/RiftCallerEnemy.js';
import CurseHexerEnemy from '../entities/enemies/CurseHexerEnemy.js';
import EnemyPool from '../systems/EnemyPool.js';
import CollisionSystem from '../systems/CollisionSystem.js';
import WaveSpawner from '../systems/WaveSpawner.js';
import DeathParticlePool from '../systems/DeathParticlePool.js';
import MaterialDropPool from '../systems/MaterialDropPool.js';
import CraftedSpellCaster from '../systems/CraftedSpellCaster.js';
import Camera from '../systems/Camera.js';
import WallSystem from '../systems/WallSystem.js';
import StructurePool from '../systems/StructurePool.js';
import AccessorySystem from '../systems/AccessorySystem.js';
import Crystal from '../entities/Crystal.js';
import TeleportPad from '../entities/TeleportPad.js';
import ZoneManager from './ZoneManager.js';
import DungeonGuardianEnemy from '../entities/enemies/DungeonGuardianEnemy.js';
import { SPELL_CONFIG } from '../data/spellConfig.js';
import { ENEMY_CONFIG } from '../data/enemyConfig.js';
import { ENEMY_DROP_MAP, DROP_AMOUNTS } from '../data/materialConfig.js';
import { getStructurePlacements } from '../data/structureConfig.js';
import { ACCESSORY_DROP_CHANCE, ACCESSORY_IDS } from '../data/accessoryConfig.js';
import { MAX_DUNGEON_FLOOR } from '../data/dungeonConfig.js';
import { DUNGEON_TIER_MULTIPLIERS } from '../data/dungeonEnemyConfig.js';

class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 0;
    this.height = 0;
    this.worldWidth = 0;
    this.worldHeight = 0;
    this.camera = null;
    this.gameLoop = null;
    this.systems = [];

    // Core systems
    this.entityManager = null;
    this.inputSystem = null;
    this.renderPipeline = null;
    this.gestureRecognizer = null;
    this.gestureUI = null;
    this.keyboardFallback = null;
    this.spellCaster = null;

    // Combat systems
    this.player = null;
    this.enemyPools = {};   // { slime, spellThief, gravityWell, phaseWraith, riftCaller, curseHexer }
    this.collisionSystem = null;
    this.waveSpawner = null;
    this.deathParticlePool = null;

    // Material & crafting systems
    this.materialDropPool = null;
    this.craftedSpellCaster = null;

    // Wall & structure systems
    this.wallSystem = null;
    this.structurePool = null;

    // Crystal (base defense target)
    this.crystal = null;

    // Zone system
    this.zoneManager = null;
    this.teleportPad = null;
    this.dungeonFloor = 1; // Current dungeon floor (1-5)

    // Dungeon floor portal state
    this.dungeonBossRoom = null; // { cx, cy } of boss room
    this.dungeonPortalActive = false; // true when boss room cleared & portal available

    // Warp state (V key to warp back from dungeon)
    this.isWarping = false;
    this.warpTimer = 0;
    this.warpDuration = 3.0; // 3 seconds

    // Accessory system
    this.accessorySystem = null;

    // Player respawn state
    this.playerRespawning = false;
    this.respawnTimer = 0;
    this.respawnDuration = 3.0; // 3 seconds

    // Slime merge tracking (group-based)
    this.slimeMergeGroups = []; // { id, slimes, survivor, center, state, timer }

    // Gesture state
    this.lastGestureResult = null;

    // WASD keyboard state
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false
    };

    // Bind methods
    this.update = this.update.bind(this);
    this.render = this.render.bind(this);
    this.resize = this.resize.bind(this);
    this.handleGestureComplete = this.handleGestureComplete.bind(this);
    this.handleKeyboardSpell = this.handleKeyboardSpell.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleHoverMove = this.handleHoverMove.bind(this);
  }

  init() {
    // Set canvas size
    this.resize();

    // World is 4x the viewport
    this.worldWidth = this.width * 4;
    this.worldHeight = this.height * 4;

    // Create camera
    this.camera = new Camera(this.width, this.height, this.worldWidth, this.worldHeight);

    // Create core systems
    this.entityManager = new EntityManager();
    this.inputSystem = new InputSystem(this.canvas);
    this.inputSystem.setCamera(this.camera);
    this.renderPipeline = new RenderPipeline(this.ctx, this.width, this.height);
    this.gestureRecognizer = new GestureRecognizer();
    this.gestureUI = new GestureUI();
    this.keyboardFallback = new KeyboardFallback();
    this.spellCaster = new SpellCaster(this.entityManager);

    // Create player at world center
    this.player = new Player({ x: this.worldWidth / 2, y: this.worldHeight / 2 });
    this.player.setCanvasSize(this.width, this.height);
    this.player.setWorldSize(this.worldWidth, this.worldHeight);
    this.player.setCamera(this.camera);

    // Wire player -> engine ref for warp cancel
    this.player.gameEngine = this;

    // Create accessory system
    this.accessorySystem = new AccessorySystem(this.player);
    this.player.setAccessorySystem(this.accessorySystem);

    // Create crystal at world center
    this.crystal = new Crystal(this.worldWidth / 2, this.worldHeight / 2);

    // Create wall system
    this.wallSystem = new WallSystem(this.worldWidth, this.worldHeight);

    // Create structure pool and spawn initial structures
    this.structurePool = new StructurePool(10);
    const placements = getStructurePlacements(this.worldWidth, this.worldHeight);
    for (const p of placements) {
      this.structurePool.spawn(p);
    }
    this.player.setStructurePool(this.structurePool);

    // Create enemy pools for all types
    this.enemyPools = {
      slime: new EnemyPool(SlimeEnemy, 30, this.player),
      spellThief: new EnemyPool(SpellThiefEnemy, 10, this.player),
      gravityWell: new EnemyPool(GravityWellEnemy, 8, this.player),
      phaseWraith: new EnemyPool(PhaseWraithEnemy, 10, this.player),
      riftCaller: new EnemyPool(RiftCallerEnemy, 8, this.player),
      curseHexer: new EnemyPool(CurseHexerEnemy, 8, this.player),
      dungeonGuardian: new EnemyPool(DungeonGuardianEnemy, 10, this.player),
    };

    // Wire wall system, crystal, and camera to enemies
    for (const key in this.enemyPools) {
      this.enemyPools[key].setWallSystem(this.wallSystem);
      this.enemyPools[key].setCrystal(this.crystal);
      this.enemyPools[key].setCamera(this.camera);
    }

    // Wire special enemy references
    // Spell Thieves need access to spell caster
    for (const enemy of this.enemyPools.spellThief.pool) {
      enemy.spellCaster = this.spellCaster;
      enemy.entityManager = this.entityManager;
    }
    // Rift Callers need access to slime pool for summoning minions
    for (const enemy of this.enemyPools.riftCaller.pool) {
      enemy.minionPool = this.enemyPools.slime;
    }

    // Create collision system (pass all pools)
    this.collisionSystem = new CollisionSystem(this.player, this.enemyPools, this.spellCaster);
    this.collisionSystem.setCrystal(this.crystal);

    // Create death particle pool
    this.deathParticlePool = new DeathParticlePool(this.entityManager, 120);

    // Create material drop pool
    this.materialDropPool = new MaterialDropPool(this.player, (materialType) => {
      useGameStore.getState().addMaterial(materialType, 1);
      // Small mana bonus on pickup
      this.player.mana = Math.min(this.player.maxMana, this.player.mana + 2);
    }, 50);

    // Create zone manager
    this.zoneManager = new ZoneManager();

    // Create teleport pad near crystal (offset to the right)
    this.teleportPad = new TeleportPad(this.worldWidth / 2 + 80, this.worldHeight / 2 + 80);

    // Create crafted spell caster
    this.craftedSpellCaster = new CraftedSpellCaster(this.player, this.enemyPools);

    // Wire BlinkStep's reference to CraftedSpellCaster for tier 3 cooldown reset
    this.craftedSpellCaster.spellInstances.blinkStep.craftedSpellCaster = this.craftedSpellCaster;

    // Create wave spawner (pass all pools)
    this.waveSpawner = new WaveSpawner(this.enemyPools, this.entityManager, this.width, this.height);
    this.waveSpawner.setCamera(this.camera);
    this.waveSpawner.setWorldSize(this.worldWidth, this.worldHeight);

    // Set canvas size, player, camera, and enemy pools for spell caster
    this.spellCaster.setCanvasSize(this.worldWidth, this.worldHeight);
    this.spellCaster.setPlayer(this.player);
    this.spellCaster.setCamera(this.camera);
    this.spellCaster.setEnemyPools(this.enemyPools);

    // Initialize input system
    this.inputSystem.init();

    // Initialize keyboard fallback
    this.keyboardFallback.init();
    this.keyboardFallback.onSpellCast = this.handleKeyboardSpell;

    // Wire gesture recognition callbacks
    this.inputSystem.onStopDrawing = this.handleGestureComplete;

    // Real-time recognition on shape closure (trail turns spell color while still drawing)
    this.inputSystem.onShapeClosed = (shapePoints) => {
      const result = this.gestureRecognizer.recognize(shapePoints);
      if (result) {
        this.inputSystem.setSpellRecognition(result.name);
      }
    };

    // Create game loop
    this.gameLoop = new GameLoop(this.update, this.render);

    // Add resize listener
    window.addEventListener('resize', this.resize);

    // Add WASD keyboard listeners
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Mouse tracking for HUD tooltips
    this.canvas.addEventListener('mousemove', this.handleHoverMove);

    // Wire zone manager with base state
    this.zoneManager.setBaseState({
      wallSystem: this.wallSystem,
      structurePool: this.structurePool,
      enemyPools: this.enemyPools,
      crystal: this.crystal,
      waveSpawner: this.waveSpawner,
      camera: this.camera,
    });

    // Start first wave
    this.waveSpawner.startNextWave();

    // Start the loop
    this.gameLoop.start();
  }

  handleKeyDown(e) {
    const key = e.key.toLowerCase();
    if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
      this.keys[key] = true;
      e.preventDefault();
    }

    // Crafted spell keys (1-5)
    if (key >= '1' && key <= '5') {
      const slot = parseInt(key) - 1;
      const store = useGameStore.getState();
      if (slot < store.maxEquipSlots && this.craftedSpellCaster) {
        this.craftedSpellCaster.castSlot(slot);
        this.player.triggerCastGlow();
      }
      e.preventDefault();
    }

    // V key to start warp (dungeon → base)
    if (key === 'v' && this.zoneManager && this.zoneManager.isInDungeon()) {
      if (!this.isWarping) {
        this.isWarping = true;
        this.warpTimer = 0;
        useGameStore.getState().setIsWarping(true);
        useGameStore.getState().setWarpProgress(0);
      }
      e.preventDefault();
    }

    // E key for teleport pad (base → dungeon) or structure/wall build / repair
    if (key === 'e' && this.player) {
      // Check teleport pad first
      if (this.teleportPad && this.zoneManager && this.zoneManager.isInBase()) {
        if (this.teleportPad.isPlayerInRange(this.player)) {
          this.enterDungeon();
          return;
        }
      }

      // Check dungeon floor portal
      if (this.zoneManager && this.zoneManager.isInDungeon() && this.dungeonPortalActive && this.dungeonBossRoom) {
        const dx = this.player.x - this.dungeonBossRoom.cx;
        const dy = this.player.y - this.dungeonBossRoom.cy;
        if (dx * dx + dy * dy < 80 * 80) {
          this.advanceDungeonFloor();
          return;
        }
      }

      // Check loot chests in dungeon
      if (this.zoneManager && this.zoneManager.isInDungeon()) {
        for (const chest of this.zoneManager.dungeonLootChests) {
          if (!chest.active || chest.opened) continue;
          if (chest.isPlayerInRange(this.player)) {
            const loot = chest.open();
            if (loot) {
              const store = useGameStore.getState();
              // Add materials
              for (const mat of loot.materials) {
                store.addMaterial(mat.type, mat.count);
              }
              // Add upgrade tokens
              if (loot.tokens > 0) {
                store.addCrystalUpgradeTokens(loot.tokens);
              }
              // Add accessory
              if (loot.accessory && this.accessorySystem) {
                const randomId = ACCESSORY_IDS[Math.floor(Math.random() * ACCESSORY_IDS.length)];
                if (this.accessorySystem.addAccessory(randomId)) {
                  store.addAccessory(randomId);
                }
              }
            }
            return;
          }
        }
      }

      const store = useGameStore.getState();

      // Priority 1: build unbuilt structures
      if (this.structurePool) {
        const unbuilt = this.structurePool.getNearestUnbuiltInRange(this.player.x, this.player.y, 60);
        if (unbuilt) {
          const cost = unbuilt.config.buildCost;
          let canAfford = true;
          for (const [mat, count] of Object.entries(cost)) {
            if ((store.inventory[mat] || 0) < count) { canAfford = false; break; }
          }
          if (canAfford) {
            store.removeMaterials(cost);
            unbuilt.build();
            if (unbuilt.config.grantsSlot) {
              store.addEquipSlot();
            }
          }
          return;
        }
      }

      // Priority 2: upgrade built structures
      if (this.structurePool) {
        const upgradeable = this.structurePool.getNearestUpgradeableInRange(this.player.x, this.player.y, 60);
        if (upgradeable) {
          const cost = upgradeable.getUpgradeCost();
          if (cost) {
            let canAfford = true;
            for (const [mat, count] of Object.entries(cost)) {
              if ((store.inventory[mat] || 0) < count) { canAfford = false; break; }
            }
            if (canAfford) {
              store.removeMaterials(cost);
              upgradeable.upgradeTier();
            }
          }
          return;
        }
      }

      // Priority 3: build unbuilt wall slots
      if (this.wallSystem) {
        const unbuiltWall = this.wallSystem.getNearestUnbuiltSlotInRange(this.player.x, this.player.y, 80);
        if (unbuiltWall) {
          const cost = this.wallSystem.getBuildCost();
          let canAfford = true;
          for (const [mat, count] of Object.entries(cost)) {
            if ((store.inventory[mat] || 0) < count) { canAfford = false; break; }
          }
          if (canAfford) {
            store.removeMaterials(cost);
            this.wallSystem.buildWallSlot(unbuiltWall);
          }
          return;
        }
      }

      // Priority 4: repair damaged built structures
      if (this.structurePool) {
        const damaged = this.structurePool.getNearestDamagedInRange(this.player.x, this.player.y, 60);
        if (damaged) {
          damaged.repair();
          return;
        }
      }

      // Priority 5: repair damaged wall slots
      if (this.wallSystem) {
        const damagedWall = this.wallSystem.getNearestDamagedWallInRange(this.player.x, this.player.y, 80);
        if (damagedWall) {
          const cost = this.wallSystem.getRepairCost();
          let canAfford = true;
          for (const [mat, count] of Object.entries(cost)) {
            if ((store.inventory[mat] || 0) < count) { canAfford = false; break; }
          }
          if (canAfford) {
            store.removeMaterials(cost);
            this.wallSystem.repairWallSlot(damagedWall);
          }
        }
      }
    }
  }

  handleKeyUp(e) {
    const key = e.key.toLowerCase();
    if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
      this.keys[key] = false;
      e.preventDefault();
    }
  }

  handleHoverMove(e) {
    if (this.renderPipeline) {
      const rect = this.canvas.getBoundingClientRect();
      this.renderPipeline.screenMouseX = e.clientX - rect.left;
      this.renderPipeline.screenMouseY = e.clientY - rect.top;
    }
  }

  /**
   * Notify Spell Thieves when player casts a spell so they can copy it.
   */
  notifySpellThieves(spellName) {
    const activeThieves = this.enemyPools.spellThief.getActive();
    for (const thief of activeThieves) {
      if (thief.active) {
        thief.copySpell(spellName);
      }
    }
  }

  handleGestureComplete(points) {
    // Direction from the last two points of the raw stroke
    const direction = TrajectoryExtractor.directionFromEnd(points);
    if (!direction) return;

    const trajectory = {
      origin: { x: points[points.length - 1].x, y: points[points.length - 1].y },
      direction,
      angle: Math.atan2(direction.y, direction.x),
      waypoints: null,
      hasArc: false,
    };

    // Split drawn points for shape recognition
    const { shapePoints } = TrajectoryExtractor.splitAndExtract(points);

    // Recognize the gesture; fall back to basic attack if unrecognized
    let result = this.gestureRecognizer.recognize(shapePoints);

    if (!result) {
      // Unrecognized shape → basic attack (free, no mana cost)
      result = {
        name: 'basic',
        score: 0.5,
        damageModifier: 0.5,
      };
    }

    // Mana check — if insufficient mana, downgrade to basic attack
    const config = SPELL_CONFIG[result.name];
    if (config && config.manaCost > 0) {
      if (this.player.mana < config.manaCost) {
        result = {
          name: 'basic',
          score: 1.0,
          damageModifier: 1.0,
        };
      } else {
        this.player.mana -= config.manaCost;
      }
    }

    // Always use last-two-points direction
    result.trajectory = trajectory;

    // Pass raw drawn points for seeking missile waypoints
    result.rawPoints = points.map(p => ({ x: p.x, y: p.y }));

    // Store result locally and in Zustand
    this.lastGestureResult = result;
    useGameStore.getState().setLastGesture(result);

    // Show visual feedback
    this.gestureUI.showResult(result);

    // Color trail with spell color
    this.inputSystem.setSpellRecognition(result.name);

    // Cast the spell (same frame as recognition)
    this.spellCaster.castSpell(result);

    // Trigger cast glow on player
    this.player.triggerCastGlow();

    // Notify Spell Thieves of the cast
    this.notifySpellThieves(result.name);

    // Debug logging
    console.log(`Gesture: ${result.name} (${(result.score * 100).toFixed(0)}%) - Damage: ${(result.damageModifier * 100).toFixed(0)}% - Angle: ${(trajectory.angle * 180 / Math.PI).toFixed(0)}°`);
  }

  handleKeyboardSpell(result) {
    // Mana check — if insufficient mana, downgrade to basic attack
    const config = SPELL_CONFIG[result.name];
    if (config && config.manaCost > 0) {
      if (this.player.mana < config.manaCost) {
        result = {
          name: 'basic',
          score: 1.0,
          damageModifier: 1.0,
          fromKeyboard: true,
        };
      } else {
        this.player.mana -= config.manaCost;
      }
    }

    // Store result locally and in Zustand
    this.lastGestureResult = result;
    useGameStore.getState().setLastGesture(result);

    // Show UI feedback (same as drawn gestures)
    this.gestureUI.showResult(result);

    // Cast the spell
    this.spellCaster.castSpell(result);

    // Trigger cast glow on player
    this.player.triggerCastGlow();

    // Notify Spell Thieves of the cast
    this.notifySpellThieves(result.name);

    // Debug logging
    console.log(`Keyboard spell: ${result.name}`);
  }

  enterDungeon() {
    if (!this.zoneManager) return;

    // Save base world dimensions for later restoration
    this.baseWorldWidth = this.worldWidth;
    this.baseWorldHeight = this.worldHeight;

    // Generate and enter dungeon at current floor
    const floor = this.dungeonFloor;
    const result = this.zoneManager.generateAndEnterDungeon(floor);
    useGameStore.getState().setDungeonFloor(floor);

    // Update world bounds to dungeon dimensions
    this.worldWidth = result.worldWidth;
    this.worldHeight = result.worldHeight;

    // Move player to dungeon spawn room center
    this.player.x = result.spawnX;
    this.player.y = result.spawnY;
    this.player.setWorldSize(this.worldWidth, this.worldHeight);

    // Update camera world bounds
    this.camera.worldWidth = this.worldWidth;
    this.camera.worldHeight = this.worldHeight;
    // Snap camera to player immediately
    this.camera.x = this.player.x - this.camera.viewWidth / 2;
    this.camera.y = this.player.y - this.camera.viewHeight / 2;
    this.camera.clamp();

    // Update enemy pool wall system and zone reference for dungeon
    const dungeonWalls = this.zoneManager.getActiveWallSystem();
    for (const key in this.enemyPools) {
      this.enemyPools[key].setWallSystem(dungeonWalls);
      this.enemyPools[key].setActiveZone('dungeon');
    }
    this.collisionSystem.setActiveZone('dungeon');

    // Save boss room position for floor portal
    this.dungeonBossRoom = result.dungeonData.bossRoom
      ? { cx: result.dungeonData.bossRoom.cx, cy: result.dungeonData.bossRoom.cy }
      : null;
    this.dungeonPortalActive = false;

    // Tier multipliers for enemy stat scaling
    const tierMult = DUNGEON_TIER_MULTIPLIERS[floor] || DUNGEON_TIER_MULTIPLIERS[1];

    // Spawn dungeon enemies from room data
    const enemyTypeMap = {
      slime: 'slime',
      spellThief: 'spellThief',
      gravityWell: 'gravityWell',
      phaseWraith: 'phaseWraith',
      curseHexer: 'curseHexer',
    };
    for (const room of result.dungeonData.rooms) {
      if (!room.enemies) continue;
      for (const enemyDef of room.enemies) {
        const poolKey = enemyTypeMap[enemyDef.type];
        if (poolKey && this.enemyPools[poolKey]) {
          const enemy = this.enemyPools[poolKey].spawn({ x: enemyDef.x, y: enemyDef.y });
          enemy.crystal = null; // No crystal target in dungeon
          enemy._zone = 'dungeon';
          // Apply tier scaling
          enemy.hp = Math.round(enemy.hp * tierMult.hp);
          enemy.maxHp = Math.round(enemy.maxHp * tierMult.hp);
          enemy.contactDamage = Math.round(enemy.contactDamage * tierMult.damage);
        }
      }
      // Boss rooms also get dungeon guardians
      if (room.role === 'boss') {
        const guardian = this.enemyPools.dungeonGuardian.spawn({ x: room.cx, y: room.cy });
        guardian.crystal = null; // No crystal target in dungeon
        guardian._zone = 'dungeon';
        // Apply tier scaling to guardian
        guardian.hp = Math.round(guardian.hp * tierMult.hp);
        guardian.maxHp = Math.round(guardian.maxHp * tierMult.hp);
        guardian.contactDamage = Math.round(guardian.contactDamage * tierMult.damage);
      }
    }

    console.log(`Entered dungeon floor ${floor}!`, result.dungeonData.rooms.length, 'rooms');
  }

  cancelWarp() {
    this.isWarping = false;
    this.warpTimer = 0;
    useGameStore.getState().setIsWarping(false);
    useGameStore.getState().setWarpProgress(0);
  }

  completeWarp() {
    this.isWarping = false;
    this.warpTimer = 0;
    useGameStore.getState().setIsWarping(false);
    useGameStore.getState().setWarpProgress(0);

    if (this.zoneManager) {
      // Release all active dungeon enemies before switching zones
      for (const key in this.enemyPools) {
        const active = this.enemyPools[key].getActive();
        for (let i = active.length - 1; i >= 0; i--) {
          if (active[i].active && active[i]._zone === 'dungeon') {
            active[i].destroy();
          }
        }
      }

      this.zoneManager.exitDungeon();

      // Restore base world dimensions
      if (this.baseWorldWidth) {
        this.worldWidth = this.baseWorldWidth;
        this.worldHeight = this.baseWorldHeight;
        this.camera.worldWidth = this.worldWidth;
        this.camera.worldHeight = this.worldHeight;
        this.player.setWorldSize(this.worldWidth, this.worldHeight);
      }

      // Move player back to teleport pad location
      if (this.teleportPad) {
        this.player.x = this.teleportPad.x;
        this.player.y = this.teleportPad.y + 50;
      }

      // Snap camera to player
      this.camera.x = this.player.x - this.camera.viewWidth / 2;
      this.camera.y = this.player.y - this.camera.viewHeight / 2;
      this.camera.clamp();

      // Restore enemy pool wall system and zone reference to base
      for (const key in this.enemyPools) {
        this.enemyPools[key].setWallSystem(this.wallSystem);
        this.enemyPools[key].setActiveZone('base');
      }
      this.collisionSystem.setActiveZone('base');
    }

    // Reset waves back to level 1 when returning from dungeon
    if (this.waveSpawner) {
      this.waveSpawner.resetToWave1();
    }

    // Advance to next floor (cap at max)
    if (this.dungeonFloor < MAX_DUNGEON_FLOOR) {
      this.dungeonFloor++;
    }
    useGameStore.getState().setDungeonFloor(this.dungeonFloor);

    console.log(`Warped back to base! Next dungeon: floor ${this.dungeonFloor}`);
  }

  advanceDungeonFloor() {
    if (!this.zoneManager || !this.zoneManager.isInDungeon()) return;
    if (this.dungeonFloor >= MAX_DUNGEON_FLOOR) {
      // Max floor reached — warp back to base
      this.completeWarp();
      return;
    }

    // Release all active dungeon enemies
    for (const key in this.enemyPools) {
      const active = this.enemyPools[key].getActive();
      for (let i = active.length - 1; i >= 0; i--) {
        if (active[i].active && active[i]._zone === 'dungeon') {
          active[i].destroy();
        }
      }
    }

    // Clear dungeon state
    this.zoneManager.exitDungeon();

    // Advance floor
    this.dungeonFloor++;
    useGameStore.getState().setDungeonFloor(this.dungeonFloor);

    // Generate and enter next floor (reuses enterDungeon logic)
    const floor = this.dungeonFloor;
    const result = this.zoneManager.generateAndEnterDungeon(floor);
    useGameStore.getState().setDungeonFloor(floor);

    // Update world bounds
    this.worldWidth = result.worldWidth;
    this.worldHeight = result.worldHeight;
    this.player.x = result.spawnX;
    this.player.y = result.spawnY;
    this.player.setWorldSize(this.worldWidth, this.worldHeight);
    this.camera.worldWidth = this.worldWidth;
    this.camera.worldHeight = this.worldHeight;
    this.camera.x = this.player.x - this.camera.viewWidth / 2;
    this.camera.y = this.player.y - this.camera.viewHeight / 2;
    this.camera.clamp();

    // Update enemy pool references for new dungeon
    const dungeonWalls = this.zoneManager.getActiveWallSystem();
    for (const key in this.enemyPools) {
      this.enemyPools[key].setWallSystem(dungeonWalls);
      this.enemyPools[key].setActiveZone('dungeon');
    }
    this.collisionSystem.setActiveZone('dungeon');

    // Save boss room and reset portal
    this.dungeonBossRoom = result.dungeonData.bossRoom
      ? { cx: result.dungeonData.bossRoom.cx, cy: result.dungeonData.bossRoom.cy }
      : null;
    this.dungeonPortalActive = false;

    // Tier multipliers
    const tierMult = DUNGEON_TIER_MULTIPLIERS[floor] || DUNGEON_TIER_MULTIPLIERS[1];

    // Spawn enemies
    const enemyTypeMap = {
      slime: 'slime', spellThief: 'spellThief', gravityWell: 'gravityWell',
      phaseWraith: 'phaseWraith', curseHexer: 'curseHexer',
    };
    for (const room of result.dungeonData.rooms) {
      if (!room.enemies) continue;
      for (const enemyDef of room.enemies) {
        const poolKey = enemyTypeMap[enemyDef.type];
        if (poolKey && this.enemyPools[poolKey]) {
          const enemy = this.enemyPools[poolKey].spawn({ x: enemyDef.x, y: enemyDef.y });
          enemy.crystal = null;
          enemy._zone = 'dungeon';
          enemy.hp = Math.round(enemy.hp * tierMult.hp);
          enemy.maxHp = Math.round(enemy.maxHp * tierMult.hp);
          enemy.contactDamage = Math.round(enemy.contactDamage * tierMult.damage);
        }
      }
      if (room.role === 'boss') {
        const guardian = this.enemyPools.dungeonGuardian.spawn({ x: room.cx, y: room.cy });
        guardian.crystal = null;
        guardian._zone = 'dungeon';
        guardian.hp = Math.round(guardian.hp * tierMult.hp);
        guardian.maxHp = Math.round(guardian.maxHp * tierMult.hp);
        guardian.contactDamage = Math.round(guardian.contactDamage * tierMult.damage);
      }
    }

    console.log(`Advanced to dungeon floor ${floor}!`);
  }

  updateSlimeMerge(dt) {
    const activeSlimes = this.enemyPools.slime.getActive();

    // Update existing merge groups
    for (let g = this.slimeMergeGroups.length - 1; g >= 0; g--) {
      const group = this.slimeMergeGroups[g];

      // Remove dead slimes from group
      group.slimes = group.slimes.filter(s => s.active);
      if (group.slimes.length < 2) {
        // Not enough slimes left — cancel merge
        for (const s of group.slimes) {
          s.mergeState = 'none';
          s.mergeGroupId = null;
          s.mergePartners = [];
        }
        this.slimeMergeGroups.splice(g, 1);
        continue;
      }

      group.timer += dt;

      switch (group.state) {
        case 'gathering': {
          // Check if all slimes arrived near center
          let allArrived = true;
          for (const s of group.slimes) {
            const dx = s.x - group.center.x;
            const dy = s.y - group.center.y;
            if (dx * dx + dy * dy > 20 * 20) {
              allArrived = false;
              break;
            }
          }
          // Transition to orbiting when all arrive or timeout
          if (allArrived || group.timer > 2.5) {
            group.state = 'orbiting';
            group.timer = 0;
            const orbitRadius = 25;
            for (let i = 0; i < group.slimes.length; i++) {
              const s = group.slimes[i];
              s.mergeState = 'orbiting';
              s.mergeOrbitRadius = orbitRadius;
              s.mergeOrbitPhase = (i / group.slimes.length) * Math.PI * 2;
            }
          }
          break;
        }
        case 'orbiting': {
          if (group.timer > 1.8) {
            group.state = 'absorbing';
            group.timer = 0;
            for (const s of group.slimes) {
              s.mergeState = 'absorbing';
              s.mergeAbsorbTimer = 0;
            }
          }
          break;
        }
        case 'absorbing': {
          if (group.timer > 0.6) {
            // Execute merge: survivor absorbs all others
            const survivor = group.survivor;
            const absorbed = group.slimes.filter(s => s !== survivor && s.active);
            for (const s of absorbed) {
              s.die();
            }
            // Apply merge boosts per absorbed slime (no cap — infinite merging)
            for (const s of absorbed) {
              survivor.applyMerge();
            }
            survivor.mergeState = 'none';
            survivor.mergeGroupId = null;
            survivor.mergePartners = [];
            this.slimeMergeGroups.splice(g, 1);
          }
          break;
        }
      }
    }

    // Detect new clusters of 3+ non-merging slimes
    const eligible = activeSlimes.filter(s =>
      s.active && s.mergeState === 'none' &&
      s.dashState !== 'dashing' && s.dashState !== 'charging'
    );

    const clusterRadius = 80;
    const visited = new Set();

    for (let i = 0; i < eligible.length; i++) {
      const start = eligible[i];
      if (visited.has(start.id)) continue;

      // BFS to find connected cluster
      const cluster = [];
      const queue = [start];
      visited.add(start.id);

      while (queue.length > 0) {
        const current = queue.shift();
        cluster.push(current);
        for (const other of eligible) {
          if (visited.has(other.id)) continue;
          const dx = other.x - current.x;
          const dy = other.y - current.y;
          if (dx * dx + dy * dy < clusterRadius * clusterRadius) {
            visited.add(other.id);
            queue.push(other);
          }
        }
      }

      if (cluster.length >= 3) {
        // Form merge group (cap at 5 slimes)
        const groupSlimes = cluster.slice(0, 5);

        // Calculate centroid
        let cx = 0, cy = 0;
        for (const s of groupSlimes) { cx += s.x; cy += s.y; }
        cx /= groupSlimes.length;
        cy /= groupSlimes.length;

        // Pick survivor (highest HP)
        let survivor = groupSlimes[0];
        for (const s of groupSlimes) {
          if (s.hp > survivor.hp) survivor = s;
        }

        const groupId = `merge_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

        const group = {
          id: groupId,
          slimes: groupSlimes,
          survivor,
          center: { x: cx, y: cy },
          state: 'gathering',
          timer: 0,
        };

        this.slimeMergeGroups.push(group);

        // Notify all slimes to start merging
        for (let j = 0; j < groupSlimes.length; j++) {
          const s = groupSlimes[j];
          s.startMerge(
            group.center,
            groupId,
            groupSlimes.filter(o => o !== s),
            s === survivor,
            (j / groupSlimes.length) * Math.PI * 2
          );
        }
      }
    }
  }

  update(dt) {
    // Warp mechanic (V key to return from dungeon)
    if (this.isWarping) {
      // Cancel warp if player moves or takes damage
      const isMoving = this.keys.w || this.keys.a || this.keys.s || this.keys.d;
      if (isMoving) {
        this.cancelWarp();
      } else {
        this.warpTimer += dt;
        useGameStore.getState().setWarpProgress(this.warpTimer / this.warpDuration);
        if (this.warpTimer >= this.warpDuration) {
          this.completeWarp();
        }
      }
    }

    // Player respawn mechanic
    if (this.player && this.player.hp <= 0 && !this.playerRespawning) {
      this.playerRespawning = true;
      this.respawnTimer = this.respawnDuration;
      // If in dungeon, warp back to base first
      if (this.zoneManager && this.zoneManager.isInDungeon()) {
        this.cancelWarp();
        this.completeWarp();
      }
    }
    if (this.playerRespawning) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        // Respawn at crystal
        const rx = this.crystal ? this.crystal.x : this.worldWidth / 2;
        const ry = this.crystal ? this.crystal.y + 40 : this.worldHeight / 2 + 40;
        this.player.respawn(rx, ry);
        this.playerRespawning = false;
        this.respawnTimer = 0;
        // Give 2s invincibility
        this.player.invincible = true;
        this.player.invincibilityTimer = 0;
        this.player.invincibilityDuration = 2000;
      }
    }

    // Update background zone (base sim when in dungeon)
    if (this.zoneManager) {
      this.zoneManager.updateBackgroundZone(dt);

      // Sync crystal HP even while in dungeon
      if (this.crystal) {
        useGameStore.getState().setCrystalHP(this.crystal.hp, this.crystal.maxHp);
        useGameStore.getState().setCrystalUnderAttack(this.crystal.isUnderAttack);
      }
    }

    // Update teleport pad
    if (this.teleportPad && this.zoneManager && this.zoneManager.isInBase()) {
      this.teleportPad.update(dt);
    }

    // Set base regen flag on player
    this.player.isInBase = !this.zoneManager || this.zoneManager.isInBase();

    // Update WASD movement direction for player
    this.player.moveDirection.x = 0;
    this.player.moveDirection.y = 0;

    if (this.keys.w) this.player.moveDirection.y -= 1;
    if (this.keys.s) this.player.moveDirection.y += 1;
    if (this.keys.a) this.player.moveDirection.x -= 1;
    if (this.keys.d) this.player.moveDirection.x += 1;

    // Update input system
    this.inputSystem.update(dt);

    // Update gesture UI
    this.gestureUI.update(dt);

    // Update spell caster pools
    this.spellCaster.update(dt);

    // Update player
    this.player.update(dt);

    // Resolve player-wall collisions (use zone-appropriate wall system)
    const activeWalls = this.zoneManager ? this.zoneManager.getActiveWallSystem() : this.wallSystem;
    if (activeWalls) {
      activeWalls.resolveCircleWallCollision(this.player, true);
    }

    // Update camera to follow player
    this.camera.follow(this.player, dt);
    this.camera.updateShake(dt);

    // Sync mana to store
    useGameStore.getState().setMana(this.player.mana);

    // Update crystal (only directly in base — background sim handles it in dungeon)
    const inBase = !this.zoneManager || this.zoneManager.isInBase();
    if (this.crystal && this.crystal.active && inBase) {
      this.crystal.update(dt, this.enemyPools);
      this.crystal.checkWarning(this.enemyPools);
      useGameStore.getState().setCrystalHP(this.crystal.hp, this.crystal.maxHp);
      useGameStore.getState().setCrystalUnderAttack(this.crystal.isUnderAttack);
    }

    // Determine active zone for enemy processing
    const currentZone = this.zoneManager ? this.zoneManager.getActiveZone() : 'base';

    // Save previous positions for render interpolation (before physics)
    for (const key in this.enemyPools) {
      for (const enemy of this.enemyPools[key].getActive()) {
        if (enemy.active && enemy._zone === currentZone) {
          enemy.prevX = enemy.x;
          enemy.prevY = enemy.y;
        }
      }
    }

    // Update all enemy pools (zone filtering happens inside pool.update)
    for (const key in this.enemyPools) {
      this.enemyPools[key].update(dt);
    }

    // Resolve enemy-wall collisions and clamp to world bounds (active zone only)
    if (activeWalls) {
      for (const key in this.enemyPools) {
        for (const enemy of this.enemyPools[key].getActive()) {
          if (enemy.active && enemy._zone === currentZone) {
            activeWalls.resolveCircleWallCollision(enemy);
          }
        }
      }
    }
    // Clamp enemies to world bounds (active zone only)
    const ww = this.worldWidth;
    const wh = this.worldHeight;
    for (const key in this.enemyPools) {
      for (const enemy of this.enemyPools[key].getActive()) {
        if (!enemy.active || enemy._zone !== currentZone) continue;
        enemy.x = Math.max(enemy.size, Math.min(ww - enemy.size, enemy.x));
        enemy.y = Math.max(enemy.size, Math.min(wh - enemy.size, enemy.y));
      }
    }


    // Update wave spawner (only in base zone — dungeon has pre-placed enemies)
    if (!this.zoneManager || this.zoneManager.isInBase()) {
      this.waveSpawner.update(dt);
    }

    // Update collision system
    this.collisionSystem.update(dt);

    // Update slime merge mechanic
    this.updateSlimeMerge(dt);

    // Update wall system animation (active zone)
    if (activeWalls) {
      activeWalls.update(dt);
    }

    // Update structures (only in base)
    if (this.structurePool && inBase) {
      this.structurePool.update(dt, this.enemyPools);

      // Enemy-structure contact damage (DPS-based)
      for (const structure of this.structurePool.getActive()) {
        for (const key in this.enemyPools) {
          for (const enemy of this.enemyPools[key].getActive()) {
            if (!enemy.active || enemy.contactDamage <= 0) continue;
            if (enemy.isPhased) continue;
            const sdx = enemy.x - structure.x;
            const sdy = enemy.y - structure.y;
            const sDist = Math.sqrt(sdx * sdx + sdy * sdy);
            if (sDist < enemy.size + structure.size) {
              structure.takeDamage(enemy.contactDamage * dt);
            }
          }
        }
      }
    }

    // Check for dead enemies across all pools and spawn death particles + material drops
    for (const key in this.enemyPools) {
      const activeEnemies = this.enemyPools[key].getActive();
      for (const enemy of activeEnemies) {
        if (enemy.justDied) {
          this.deathParticlePool.spawnBurst(enemy.x, enemy.y, enemy.color);

          // Notify accessory system of kill
          if (this.accessorySystem) {
            this.accessorySystem.onEnemyKilled(key);
          }

          // Spawn material drop (with accessory modifiers)
          const materialType = ENEMY_DROP_MAP[key];
          if (materialType) {
            const dropRange = DROP_AMOUNTS[key] || { min: 1, max: 1 };
            let dropCount = dropRange.min + Math.floor(Math.random() * (dropRange.max - dropRange.min + 1));
            // Treasure Compass + Lucky Foot modifiers
            if (this.accessorySystem) {
              if (dropCount > 0) {
                dropCount = Math.ceil(dropCount * this.accessorySystem.getDropCountModifier());
                dropCount *= this.accessorySystem.rollExtraDrops();
              }
            }
            for (let i = 0; i < dropCount; i++) {
              const offsetX = (Math.random() - 0.5) * 20;
              const offsetY = (Math.random() - 0.5) * 20;
              this.materialDropPool.spawn({
                x: enemy.x + offsetX,
                y: enemy.y + offsetY,
                materialType,
              });
            }
          }

          // Accessory drop chance
          if (this.accessorySystem) {
            const dropChance = ACCESSORY_DROP_CHANCE[key];
            if (dropChance && Math.random() < dropChance) {
              const randomId = ACCESSORY_IDS[Math.floor(Math.random() * ACCESSORY_IDS.length)];
              if (this.accessorySystem.addAccessory(randomId)) {
                useGameStore.getState().addAccessory(randomId);
              }
            }
          }

          enemy.justDied = false;
        }
      }
    }

    // Update dungeon loot chests and check for floor portal activation
    if (this.zoneManager && this.zoneManager.isInDungeon()) {
      for (const chest of this.zoneManager.dungeonLootChests) {
        if (chest.active) chest.update(dt);
      }

      // Check if all dungeon enemies are dead → activate floor portal
      if (this.dungeonBossRoom && !this.dungeonPortalActive) {
        let dungeonEnemiesAlive = 0;
        for (const key in this.enemyPools) {
          for (const enemy of this.enemyPools[key].getActive()) {
            if (enemy.active && enemy._zone === 'dungeon') dungeonEnemiesAlive++;
          }
        }
        if (dungeonEnemiesAlive === 0) {
          this.dungeonPortalActive = true;
        }
      }
    }

    // Update material drop pool
    this.materialDropPool.update(dt);

    // Update accessory system
    if (this.accessorySystem) {
      this.accessorySystem.update(dt, this.enemyPools);
    }

    // Update crafted spell caster
    this.craftedSpellCaster.update(dt);

    // Update death particle pool
    this.deathParticlePool.update(dt);

    // Update entity manager
    this.entityManager.update(dt);

    // Apply boundary behavior for entities (world bounds)
    const entities = this.entityManager.getAll();
    for (const entity of entities) {
      // Projectiles get destroyed when out of world bounds or hitting walls
      if (entity.type.startsWith('projectile-')) {
        // Earth wave is stationary — don't destroy on wall collision
        if (entity.type === 'projectile-earthwave') continue;

        if (entity.x < -entity.size || entity.x > this.worldWidth + entity.size ||
            entity.y < -entity.size || entity.y > this.worldHeight + entity.size) {
          // Water bomb explodes at end of life/boundary
          if (entity.type === 'projectile-waterbomb' && entity.explode) {
            entity.explode();
          } else {
            entity.destroy();
          }
        } else if (activeWalls && activeWalls.checkProjectileWallCollision(entity)) {
          if (entity.type === 'projectile-waterbomb' && entity.explode) {
            entity.explode();
          } else {
            entity.destroy();
          }
        }
      } else {
        // Non-projectiles clamped to world bounds
        entity.x = Math.max(entity.size, Math.min(this.worldWidth - entity.size, entity.x));
        entity.y = Math.max(entity.size, Math.min(this.worldHeight - entity.size, entity.y));
      }
    }

    // Update all systems
    this.systems.forEach(system => {
      if (system.update) {
        system.update(dt);
      }
    });

    // Update FPS in Zustand store
    const fps = this.gameLoop.getFPS();
    useGameStore.getState().setFPS(fps);
  }

  render(interpolation) {
    // Clear canvas (transparent so video background shows through)
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Semi-transparent dark overlay to keep game readable over video
    this.ctx.fillStyle = 'rgba(10, 10, 18, 0.75)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Determine the active wall system for the current zone
    const renderWalls = this.zoneManager ? this.zoneManager.getActiveWallSystem() : this.wallSystem;

    // Render pipeline
    // Pass respawn state for HUD overlay
    this.renderPipeline.playerRespawning = this.playerRespawning;
    this.renderPipeline.respawnTimer = this.respawnTimer;
    // Pass dungeon portal state
    this.renderPipeline._dungeonPortalActive = this.dungeonPortalActive;
    this.renderPipeline._dungeonBossRoom = this.dungeonBossRoom;

    this.renderPipeline.render(
      this.ctx,
      this.entityManager,
      this.inputSystem,
      interpolation,
      this.gestureUI,
      this.player,
      this.enemyPools,
      this.waveSpawner,
      this.materialDropPool,
      this.craftedSpellCaster,
      this.camera,
      renderWalls,
      this.structurePool,
      this.accessorySystem,
      this.crystal,
      this.teleportPad,
      this.zoneManager,
      this.spellCaster
    );

    // Render all systems
    this.systems.forEach(system => {
      if (system.render) {
        system.render(this.ctx, interpolation);
      }
    });

  }

  addSystem(system) {
    this.systems.push(system);
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Update camera viewport size
    if (this.camera) {
      this.camera.resize(this.width, this.height);
    }

    // Update spell caster canvas size (use world bounds)
    if (this.spellCaster) {
      this.spellCaster.setCanvasSize(this.worldWidth || this.width, this.worldHeight || this.height);
    }

    // Update player canvas size
    if (this.player) {
      this.player.setCanvasSize(this.width, this.height);
    }

    // Update wave spawner canvas size
    if (this.waveSpawner) {
      this.waveSpawner.setCanvasSize(this.width, this.height);
    }
  }

  destroy() {
    // Clean up input system
    if (this.inputSystem) {
      this.inputSystem.destroy();
    }

    // Clean up keyboard fallback
    if (this.keyboardFallback) {
      this.keyboardFallback.destroy();
    }

    // Stop game loop
    if (this.gameLoop) {
      this.gameLoop.stop();
    }

    // Remove resize listener
    window.removeEventListener('resize', this.resize);

    // Remove WASD listeners
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);

    // Remove hover listener
    if (this.canvas) this.canvas.removeEventListener('mousemove', this.handleHoverMove);

    // Clear references
    this.canvas = null;
    this.ctx = null;
    this.gameLoop = null;
    this.systems = [];
    this.entityManager = null;
    this.inputSystem = null;
    this.renderPipeline = null;
    this.gestureRecognizer = null;
    this.gestureUI = null;
    this.keyboardFallback = null;
    this.spellCaster = null;
    this.player = null;
    this.enemyPools = {};
    this.collisionSystem = null;
    this.waveSpawner = null;
    this.deathParticlePool = null;
    this.materialDropPool = null;
    this.craftedSpellCaster = null;
    this.camera = null;
    this.wallSystem = null;
    this.structurePool = null;
    this.accessorySystem = null;
    this.crystal = null;
    this.zoneManager = null;
    this.teleportPad = null;
    this.slimeMergeGroups = null;
    this.lastGestureResult = null;
  }
}

export default GameEngine;
