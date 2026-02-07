import GestureRecognizer from '@2players/dollar1-unistroke-recognizer';
import GESTURE_TEMPLATES from '../data/gestureTemplates.js';

class GestureRecognizerSystem {
  constructor() {
    // Create recognizer without default strokes (custom gestures only)
    this.recognizer = new GestureRecognizer({ defaultStrokes: false });
    this.recognitionThreshold = 0.65; // 65% match = success (generous for playability)
    this.lastResult = null;

    // Load templates on creation
    this.loadTemplates();
  }

  loadTemplates() {
    // Load 3 variations per gesture for 99% accuracy
    // Each template is added as "${name}-${index}" to the recognizer
    let totalTemplates = 0;

    GESTURE_TEMPLATES.forEach(({ name, variations }) => {
      variations.forEach((points, i) => {
        const templateName = `${name}-${i}`;
        this.recognizer.add(templateName, points);
        totalTemplates++;
      });
    });

    console.log(`[GestureRecognizer] Loaded ${totalTemplates} templates for ${GESTURE_TEMPLATES.length} gestures`);
  }

  recognize(points) {
    // Require minimum 10 points to avoid false positives from single clicks
    if (!points || points.length < 10) {
      return null;
    }

    // Convert points to $1 format: [{x, y}, {x, y}, ...]
    // Strip timestamp and alpha properties if present
    const stroke = points.map(p => ({ x: p.x, y: p.y }));

    try {
      // Access the underlying dollarRecognizer for full result (name + score)
      // The wrapper's recognize() only returns the name, but we need the score
      const result = this.recognizer.dollarRecognizer.Recognize(
        stroke.map(p => ({ x: p.x, y: p.y })),
        true // useProtractor = true for 10x speed boost
      );

      // Result format: { Name: string, Score: number, Time: number }
      // Extract base gesture name (remove template variation suffix)
      const gestureName = result.Name.split('-')[0];
      const score = result.Score;

      // Only accept recognition if score meets threshold
      if (score >= this.recognitionThreshold) {
        this.lastResult = {
          name: gestureName,
          score: score,
          damageModifier: this.calculateDamageModifier(score)
        };

        return this.lastResult;
      }

      // Below threshold - no match
      this.lastResult = null;
      return null;

    } catch (error) {
      console.error('[GestureRecognizer] Recognition error:', error);
      return null;
    }
  }

  calculateDamageModifier(score) {
    // Linear mapping from recognition score to damage multiplier
    // 60% recognition -> 0.5x damage (minimum)
    // 100% recognition -> 1.0x damage (maximum)

    const minThreshold = 0.60;
    const maxScore = 1.00;

    // Clamp score to valid range
    const clampedScore = Math.max(minThreshold, Math.min(maxScore, score));

    // Linear interpolation: 0.5 + (score - 0.6) / (1.0 - 0.6) * 0.5
    const modifier = 0.5 + ((clampedScore - minThreshold) / (maxScore - minThreshold)) * 0.5;

    return modifier;
  }

  getLastResult() {
    return this.lastResult;
  }

  clearResult() {
    this.lastResult = null;
  }
}

export default GestureRecognizerSystem;
