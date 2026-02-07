class RenderPipeline {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  render(ctx, entityManager, inputSystem, interpolation, gestureUI) {
    // Layer 1: Background (already cleared by engine with #0a0a12)

    // Layer 2: Game entities
    entityManager.render(ctx, interpolation);

    // Layer 3: Drawing trail (renders above entities)
    inputSystem.render(ctx);

    // Layer 4: UI overlays
    if (gestureUI) {
      gestureUI.render(ctx, ctx.canvas.width, ctx.canvas.height);
    }
  }
}

export default RenderPipeline;
