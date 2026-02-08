/**
 * SpriteCache — pre-renders common shapes to offscreen canvases.
 * Using drawImage from a cached canvas is far cheaper than
 * re-drawing arcs + shadowBlur every frame.
 */
const _cache = new Map();

const SpriteCache = {
  /**
   * Get (or create) an offscreen canvas with a glowing circle.
   * @param {number} radius - circle radius
   * @param {string} color - fill color
   * @param {number} [glow=0] - glow radius (simulated with larger translucent circle)
   * @returns {{ canvas: OffscreenCanvas|HTMLCanvasElement, cx: number, cy: number }}
   */
  getCircle(radius, color, glow = 0) {
    const key = `c_${radius}_${color}_${glow}`;
    if (_cache.has(key)) return _cache.get(key);

    const pad = glow > 0 ? glow + 2 : 2;
    const size = (radius + pad) * 2;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const cx = size / 2;
    const cy = size / 2;

    // Glow layer (larger, semi-transparent)
    if (glow > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius + glow * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.15;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Main body
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    const entry = { canvas, cx, cy };
    _cache.set(key, entry);
    return entry;
  },

  /**
   * Draw a cached glowing circle at world position.
   */
  drawCircle(ctx, x, y, radius, color, glow = 0) {
    const sprite = this.getCircle(radius, color, glow);
    ctx.drawImage(sprite.canvas, x - sprite.cx, y - sprite.cy);
  },

  /**
   * Clear the entire cache (e.g. on resolution change).
   */
  clear() {
    _cache.clear();
  },
};

export default SpriteCache;
