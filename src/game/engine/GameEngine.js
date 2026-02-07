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

    // Gesture state
    this.lastGestureResult = null;

    // Bind methods
    this.update = this.update.bind(this);
    this.render = this.render.bind(this);
    this.resize = this.resize.bind(this);
    this.handleGestureComplete = this.handleGestureComplete.bind(this);
    this.handleKeyboardSpell = this.handleKeyboardSpell.bind(this);
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

    // Initialize input system
    this.inputSystem.init();

    // Initialize keyboard fallback
    this.keyboardFallback.init();
    this.keyboardFallback.onSpellCast = this.handleKeyboardSpell;

    // Wire gesture recognition callback
    this.inputSystem.onStopDrawing = this.handleGestureComplete;

    // Spawn 5 test entities with random properties
    const colors = ['#4a8f8f', '#f4e8c1', '#7eb8da'];
    for (let i = 0; i < 5; i++) {
      const entity = new Entity({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 100, // -50 to 50 pixels/second
        vy: (Math.random() - 0.5) * 100,
        size: 8 + Math.random() * 12, // 8 to 20
        color: colors[i % colors.length],
        type: 'test'
      });
      this.entityManager.add(entity);
    }

    // Create game loop
    this.gameLoop = new GameLoop(this.update, this.render);

    // Add resize listener
    window.addEventListener('resize', this.resize);

    // Start the loop
    this.gameLoop.start();
  }

  handleGestureComplete(points) {
    // Recognize the gesture from drawn points
    const result = this.gestureRecognizer.recognize(points);

    if (result) {
      // Extract trajectory direction from the drawn gesture
      const trajectory = TrajectoryExtractor.extractFromCenter(points);
      result.trajectory = trajectory;

      // Store result locally and in Zustand
      this.lastGestureResult = result;
      useGameStore.getState().setLastGesture(result);

      // Show visual feedback
      this.gestureUI.showResult(result);
      this.inputSystem.setRecognitionResult(result);

      // Debug logging
      console.log(`Gesture: ${result.name} (${(result.score * 100).toFixed(0)}%) - Damage: ${(result.damageModifier * 100).toFixed(0)}%`, trajectory ? `- Trajectory: ${(trajectory.angle * 180 / Math.PI).toFixed(0)}°` : '- No trajectory');
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

    // Debug logging
    console.log(`Keyboard spell: ${result.name}`);
  }

  update(dt) {
    // Update input system
    this.inputSystem.update(dt);

    // Update gesture UI
    this.gestureUI.update(dt);

    // Update entity manager
    this.entityManager.update(dt);

    // Apply boundary wrapping for entities
    const entities = this.entityManager.getAll();
    for (const entity of entities) {
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

    // Render pipeline (entities, then trail, then UI)
    this.renderPipeline.render(this.ctx, this.entityManager, this.inputSystem, interpolation, this.gestureUI);

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
    this.lastGestureResult = null;
  }
}

export default GameEngine;
