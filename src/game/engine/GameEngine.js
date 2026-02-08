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
import EnemyPool from '../systems/EnemyPool.js';
import CollisionSystem from '../systems/CollisionSystem.js';
import WaveSpawner from '../systems/WaveSpawner.js';
import DeathParticlePool from '../systems/DeathParticlePool.js';
import { ENEMY_CONFIG } from '../data/enemyConfig.js';

class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 0;
    this.height = 0;
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
    this.enemyPool = null;
    this.collisionSystem = null;
    this.waveSpawner = null;
    this.deathParticlePool = null;

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
  }

  init() {
    // Set canvas size
    this.resize();

    // Create core systems
    this.entityManager = new EntityManager();
    this.inputSystem = new InputSystem(this.canvas);
    this.renderPipeline = new RenderPipeline(this.ctx, this.width, this.height);
    this.gestureRecognizer = new GestureRecognizer();
    this.gestureUI = new GestureUI();
    this.keyboardFallback = new KeyboardFallback();
    this.spellCaster = new SpellCaster(this.entityManager);

    // Create player at center
    this.player = new Player({ x: this.width / 2, y: this.height / 2 });
    this.player.setCanvasSize(this.width, this.height);

    // Create enemy pool
    this.enemyPool = new EnemyPool(SlimeEnemy, 20, this.player);

    // Create collision system
    this.collisionSystem = new CollisionSystem(this.player, this.enemyPool, this.spellCaster);

    // Create death particle pool
    this.deathParticlePool = new DeathParticlePool(this.entityManager, 80);

    // Create wave spawner
    this.waveSpawner = new WaveSpawner({ slime: this.enemyPool }, this.entityManager, this.width, this.height);

    // Set canvas size for spell caster
    this.spellCaster.setCanvasSize(this.width, this.height);

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
  }

  handleKeyUp(e) {
    const key = e.key.toLowerCase();
    if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
      this.keys[key] = false;
      e.preventDefault();
    }
  }


  handleGestureComplete(points) {
    // Split drawn points into shape (for recognition) and tail arc (for trajectory)
    const { shapePoints, trajectory } = TrajectoryExtractor.splitAndExtract(points);

    // Recognize the gesture from shape points only (tail excluded for closing shapes)
    const result = this.gestureRecognizer.recognize(shapePoints);

    if (result) {
      result.trajectory = trajectory;

      // Store result locally and in Zustand
      this.lastGestureResult = result;
      useGameStore.getState().setLastGesture(result);

      // Show visual feedback
      this.gestureUI.showResult(result);

      // Color trail with spell color (for non-closing shapes that didn't get early recognition)
      this.inputSystem.setSpellRecognition(result.name);

      // Cast the spell (same frame as recognition)
      this.spellCaster.castSpell(result);

      // Debug logging
      const arcInfo = trajectory?.hasArc ? `Arc: ${trajectory.waypoints.length} waypoints` : 'Straight';
      console.log(`Gesture: ${result.name} (${(result.score * 100).toFixed(0)}%) - Damage: ${(result.damageModifier * 100).toFixed(0)}%`, trajectory ? `- ${arcInfo} ${(trajectory.angle * 180 / Math.PI).toFixed(0)}°` : '- No trajectory');
    } else {
      // No recognition or below threshold
      this.lastGestureResult = null;
      useGameStore.getState().clearGesture();
    }
  }

  handleKeyboardSpell(result) {
    // Store result locally and in Zustand
    this.lastGestureResult = result;
    useGameStore.getState().setLastGesture(result);

    // Show UI feedback (same as drawn gestures)
    this.gestureUI.showResult(result);

    // Cast the spell
    this.spellCaster.castSpell(result);

    // Debug logging
    console.log(`Keyboard spell: ${result.name}`);
  }

  update(dt) {
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

    // Update enemy pool
    this.enemyPool.update(dt);

    // Update wave spawner
    this.waveSpawner.update(dt);

    // Update collision system
    this.collisionSystem.update(dt);

    // Check for dead enemies and spawn death particles
    const activeEnemies = this.enemyPool.getActive();
    for (const enemy of activeEnemies) {
      if (enemy.justDied) {
        this.deathParticlePool.spawnBurst(enemy.x, enemy.y, enemy.color);
        enemy.justDied = false; // Reset flag
      }
    }

    // Update death particle pool
    this.deathParticlePool.update(dt);

    // Update entity manager
    this.entityManager.update(dt);

    // Apply boundary behavior for entities
    const entities = this.entityManager.getAll();
    for (const entity of entities) {
      // Projectiles get destroyed when out of bounds
      if (entity.type.startsWith('projectile-')) {
        if (entity.x < -entity.size || entity.x > this.width + entity.size ||
            entity.y < -entity.size || entity.y > this.height + entity.size) {
          entity.destroy();
        }
      } else {
        // Non-projectiles wrap around
        // Wrap horizontally
        if (entity.x < -entity.size) {
          entity.x = this.width + entity.size;
        } else if (entity.x > this.width + entity.size) {
          entity.x = -entity.size;
        }

        // Wrap vertically
        if (entity.y < -entity.size) {
          entity.y = this.height + entity.size;
        } else if (entity.y > this.height + entity.size) {
          entity.y = -entity.size;
        }
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
    // Clear canvas with dark background
    this.ctx.fillStyle = '#0a0a12';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Render pipeline (entities, player, enemies, trail, UI, HUD)
    this.renderPipeline.render(this.ctx, this.entityManager, this.inputSystem, interpolation, this.gestureUI, this.player, this.enemyPool, this.waveSpawner);

    // Render all systems
    this.systems.forEach(system => {
      if (system.render) {
        system.render(this.ctx, interpolation);
      }
    });

    // Draw FPS counter in top-left corner
    this.ctx.fillStyle = 'rgba(126, 184, 218, 0.6)';
    this.ctx.font = '14px monospace';
    this.ctx.fillText(`FPS: ${this.gameLoop.getFPS()}`, 10, 20);
  }

  addSystem(system) {
    this.systems.push(system);
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Update spell caster canvas size
    if (this.spellCaster) {
      this.spellCaster.setCanvasSize(this.width, this.height);
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
    this.enemyPool = null;
    this.collisionSystem = null;
    this.waveSpawner = null;
    this.deathParticlePool = null;
    this.lastGestureResult = null;
  }
}

export default GameEngine;
