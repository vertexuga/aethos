import GameLoop from './GameLoop.js';
import { useGameStore } from '../../stores/gameStore.js';

class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 0;
    this.height = 0;
    this.gameLoop = null;
    this.systems = [];

    // Test animation state
    this.testTime = 0;

    // Bind methods
    this.update = this.update.bind(this);
    this.render = this.render.bind(this);
    this.resize = this.resize.bind(this);
  }

  init() {
    // Set canvas size
    this.resize();

    // Create game loop
    this.gameLoop = new GameLoop(this.update, this.render);

    // Add resize listener
    window.addEventListener('resize', this.resize);

    // Start the loop
    this.gameLoop.start();
  }

  update(dt) {
    // Update test animation time
    this.testTime += dt;

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

    // Render test visual: teal circle moving in sine wave
    const x = (Math.sin(this.testTime) * 0.5 + 0.5) * this.width;
    const y = this.height / 2;
    const radius = 15;

    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#4a8f8f';
    this.ctx.fill();

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
  }
}

export default GameEngine;
