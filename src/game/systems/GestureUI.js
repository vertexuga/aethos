import { SPELL_CONFIG } from '../data/spellConfig.js';

class GestureUI {
  constructor() {
    this.displayResult = null; // Current result being shown
    this.displayTimer = 0; // Time remaining to show result (seconds)
    this.displayDuration = 2.0; // Show for 2 seconds
  }

  showResult(result) {
    this.displayResult = result;
    this.displayTimer = this.displayDuration;
  }

  update(dt) {
    if (this.displayTimer > 0) {
      this.displayTimer -= dt;
      if (this.displayTimer <= 0) {
        this.displayResult = null;
      }
    }
  }

  render(ctx, canvasWidth, canvasHeight) {
    if (!this.displayResult) return;

    // Calculate fade alpha (fade out in last 0.5s)
    const fadeAlpha = Math.min(1, this.displayTimer / 0.5);

    ctx.save();

    // Text alignment
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Shadow for readability
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';

    // Get spell display name from config, fallback to gesture name
    const spellConfig = SPELL_CONFIG[this.displayResult.name];
    const displayName = spellConfig ? spellConfig.name : this.displayResult.name;

    // Draw spell name (centered near top)
    const nameX = canvasWidth / 2;
    const nameY = 80;
    ctx.font = "bold 28px 'Cinzel Decorative', serif";
    ctx.fillStyle = `rgba(244, 232, 193, ${fadeAlpha})`;
    ctx.fillText(displayName.toUpperCase(), nameX, nameY);

    // Determine accuracy quality and color
    const score = this.displayResult.score;
    let qualityText, qualityColor;

    if (score >= 0.90) {
      qualityText = 'Perfect!';
      qualityColor = `rgba(244, 232, 193, ${fadeAlpha})`; // Gold
    } else if (score >= 0.80) {
      qualityText = 'Great!';
      qualityColor = `rgba(129, 199, 132, ${fadeAlpha})`; // Green
    } else if (score >= 0.70) {
      qualityText = 'Good';
      qualityColor = `rgba(126, 184, 218, ${fadeAlpha})`; // Teal
    } else {
      qualityText = 'Sloppy';
      qualityColor = `rgba(150, 150, 150, ${fadeAlpha})`; // Dim gray
    }

    // Draw accuracy score below shape name
    const accuracyX = canvasWidth / 2;
    const accuracyY = 115;
    ctx.font = "20px 'Cormorant Garamond', serif";
    ctx.fillStyle = qualityColor;
    const percentText = `${qualityText} ${(score * 100).toFixed(0)}%`;
    ctx.fillText(percentText, accuracyX, accuracyY);

    // Draw damage modifier
    const damageX = canvasWidth / 2;
    const damageY = 145;
    ctx.font = '16px monospace';
    // Same color as quality but slightly dimmer
    const damageAlpha = fadeAlpha * 0.8;
    ctx.fillStyle = qualityColor.replace(`${fadeAlpha})`, `${damageAlpha})`);
    const damageModifier = this.displayResult.damageModifier || 1.0;
    const damageText = `${(damageModifier * 100).toFixed(0)}% damage`;
    ctx.fillText(damageText, damageX, damageY);

    // Debug: show raw recognized gesture name
    const debugY = 175;
    ctx.font = '14px monospace';
    ctx.fillStyle = `rgba(150, 150, 150, ${fadeAlpha * 0.6})`;
    ctx.fillText(`gesture: ${this.displayResult.name}`, canvasWidth / 2, debugY);

    ctx.restore();
  }
}

export default GestureUI;
