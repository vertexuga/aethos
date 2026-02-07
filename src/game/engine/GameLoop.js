class GameLoop {
  constructor(updateFn, renderFn) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
    this.FIXED_TIMESTEP = 1000 / 60; // 16.67ms for 60 FPS
    this.accumulator = 0;
    this.lastTime = 0;
    this.running = false;
    this.rafId = null;
    this.frameCount = 0;
    this.fpsTimer = 0;
    this.fps = 0;

    // Bind tick to preserve context
    this.tick = this.tick.bind(this);
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  tick(currentTime) {
    if (!this.running) return;

    // Calculate delta time and cap at 250ms to prevent spiral of death
    let deltaTime = currentTime - this.lastTime;
    if (deltaTime > 250) {
      deltaTime = 250;
    }
    this.lastTime = currentTime;

    // Accumulate time
    this.accumulator += deltaTime;

    // Fixed timestep updates
    while (this.accumulator >= this.FIXED_TIMESTEP) {
      this.updateFn(this.FIXED_TIMESTEP / 1000); // Convert to seconds
      this.accumulator -= this.FIXED_TIMESTEP;
    }

    // Render with interpolation factor
    const interpolation = this.accumulator / this.FIXED_TIMESTEP;
    this.renderFn(interpolation);

    // Track FPS
    this.frameCount++;
    this.fpsTimer += deltaTime;
    if (this.fpsTimer >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    // Continue loop
    if (this.running) {
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  getFPS() {
    return this.fps;
  }
}

export default GameLoop;
