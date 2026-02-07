class KeyboardFallback {
  constructor() {
    // Mapping of keys to spell names
    this.keyMap = {
      'q': 'circle',     // Quick Shot
      'Q': 'circle',
      'w': 'triangle',   // Magic Missile
      'W': 'triangle',
      'e': 'zigzag',     // Fireball
      'E': 'zigzag'
    };

    // Callback for spell casting
    this.onSpellCast = null;

    // Bind event handler
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  init() {
    window.addEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown(e) {
    // Check if key is in our map
    const spellName = this.keyMap[e.key];

    // Only cast if:
    // 1. Key is mapped to a spell
    // 2. Not typing in an input field
    // 3. Callback is set
    if (spellName && e.target.tagName !== 'INPUT' && this.onSpellCast) {
      e.preventDefault();

      // Create perfect recognition result (keyboard casts are 100% accurate)
      const result = {
        name: spellName,
        score: 1.0,
        damageModifier: 1.0,
        fromKeyboard: true
      };

      this.onSpellCast(result);
    }
  }

  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
  }
}

export default KeyboardFallback;
