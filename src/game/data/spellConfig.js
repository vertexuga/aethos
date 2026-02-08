export const SPELL_CONFIG = {
  star: {
    name: 'Seeking Missile',
    speed: 200,
    size: 10,
    color: '#e040fb',
    baseDamage: 12,
    lifetime: 5000,
    manaCost: 15,
    piercing: true
  },
  circle: {
    name: 'Water Bomb',
    speed: 250,
    size: 14,
    color: '#29b6f6',
    baseDamage: 25,
    lifetime: 3000,
    manaCost: 20,
    splashRadius: 80,
    puddleRadius: 60,
    puddleDuration: 4000,
    slowFactor: 0.4,
    piercing: false
  },
  line: {
    name: 'Lightning Strike',
    color: '#ffeb3b',
    baseDamage: 35,
    manaCost: 25,
    targets: 4,
    range: 'viewport'
  },
  triangle: {
    name: 'Earth Wave',
    speed: 120,
    size: 20,
    color: '#8d6e63',
    baseDamage: 20,
    manaCost: 20,
    maxSize: 120,
    stunDuration: 1500,
    lifetime: 2000
  },
  basic: {
    name: 'Basic Attack',
    speed: 300,
    size: 8,
    color: '#b0bec5',
    baseDamage: 6,
    lifetime: 2000,
    manaCost: 0,
    piercing: true
  }
};
