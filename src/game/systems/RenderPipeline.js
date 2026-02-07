class RenderPipeline {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  render(ctx, entityManager, inputSystem, interpolation) {
    // Layer 1: Background (already cleared by engine with #0a0a12)

    // Layer 2: Game entities
    entityManager.render(ctx, interpolation);

    // Layer 3: Drawing trail (renders above entities)
    inputSystem.render(ctx);

    // Layer 4: UI overlays (future: HUD, score, etc.)
  }
}

export default RenderPipeline;
