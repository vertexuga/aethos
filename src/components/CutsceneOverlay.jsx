import React, { useState, useEffect, useCallback, useRef } from 'react';

const SCENES = [
  {
    text: 'Thunder split the sky the night the Spire fell.',
    subtext: 'For a thousand years it had stood — a beacon of arcane knowledge, home to the last order of Weavers.',
    animation: 'spire',
  },
  {
    text: 'So they did not see it coming.',
    subtext: 'The Void poured through the cracks between worlds — formless, hungry, endless. The Weavers fought. One by one, their lights went dark.',
    animation: 'void',
  },
  {
    text: 'He closed his eyes and spoke the forbidden words.',
    subtext: 'The last Weaver poured every fragment of his power into a single crystal — an Aethercrystal — binding the Void\'s advance to one place, one moment, one chance.',
    animation: 'crystal',
  },
  {
    text: 'The wizard gasped awake in an empty field.',
    subtext: 'The Spire was gone. The order was gone. But the crystal pulsed beside him, alive with stolen light. It had worked — barely.',
    animation: 'rebirth',
  },
  {
    emphasis: true,
    text: '"One life remains. One crystal stands. Hold the line, Weaver."',
    subtext: 'The Void stirs again. They will come in waves — shadows, beasts, things without names. The crystal must not fall.',
    animation: 'whisper',
  },
  {
    title: true,
    text: 'Defend the Crystal.',
    subtext: 'Survive the Siege.',
    animation: 'title',
  },
];

// --- Canvas animation renderers for each scene ---

function drawSpire(ctx, w, h, t) {
  // Tall spire in center with lightning and floating particles
  const cx = w / 2, cy = h / 2;

  // Sky particles (stars)
  for (let i = 0; i < 40; i++) {
    const sx = (Math.sin(i * 73.7 + t * 0.2) * 0.5 + 0.5) * w;
    const sy = (Math.cos(i * 41.3 + t * 0.15) * 0.5 + 0.5) * h * 0.6;
    const alpha = 0.3 + 0.3 * Math.sin(t * 2 + i);
    ctx.fillStyle = `rgba(126, 184, 218, ${alpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Spire body (tall narrow trapezoid)
  const spireW = 30, spireH = 200;
  ctx.fillStyle = 'rgba(30, 25, 50, 0.9)';
  ctx.beginPath();
  ctx.moveTo(cx - spireW, cy + spireH / 2);
  ctx.lineTo(cx - spireW * 0.3, cy - spireH / 2);
  ctx.lineTo(cx + spireW * 0.3, cy - spireH / 2);
  ctx.lineTo(cx + spireW, cy + spireH / 2);
  ctx.closePath();
  ctx.fill();

  // Spire glow
  const glow = ctx.createRadialGradient(cx, cy - spireH / 2, 0, cx, cy - spireH / 2, 60);
  glow.addColorStop(0, 'rgba(126, 184, 218, 0.3)');
  glow.addColorStop(1, 'rgba(126, 184, 218, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy - spireH / 2, 60, 0, Math.PI * 2);
  ctx.fill();

  // Lightning bolts (periodic)
  if (Math.sin(t * 3) > 0.7) {
    ctx.strokeStyle = 'rgba(200, 220, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let lx = cx + (Math.random() - 0.5) * 100;
    let ly = cy - spireH / 2 - 40;
    ctx.moveTo(lx, ly);
    for (let s = 0; s < 6; s++) {
      lx += (Math.random() - 0.5) * 30;
      ly += 15 + Math.random() * 10;
      ctx.lineTo(lx, ly);
    }
    ctx.stroke();
  }

  // Floating rune particles around spire
  for (let i = 0; i < 8; i++) {
    const angle = t * 0.5 + (i / 8) * Math.PI * 2;
    const rx = cx + Math.cos(angle) * (50 + i * 5);
    const ry = cy + Math.sin(angle) * 30 - 20;
    const alpha = 0.3 + 0.2 * Math.sin(t * 2 + i * 1.5);
    ctx.fillStyle = `rgba(244, 232, 193, ${alpha})`;
    ctx.beginPath();
    ctx.arc(rx, ry, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawVoid(ctx, w, h, t) {
  // Dark void creatures swarming, lights going out
  const cx = w / 2, cy = h / 2;

  // Void tendrils
  for (let i = 0; i < 12; i++) {
    const baseAngle = (i / 12) * Math.PI * 2;
    const wave = Math.sin(t * 1.5 + i * 2) * 0.3;
    const angle = baseAngle + wave;
    const len = 100 + Math.sin(t + i * 3) * 40;

    ctx.strokeStyle = `rgba(80, 0, 120, ${0.3 + 0.2 * Math.sin(t + i)})`;
    ctx.lineWidth = 3 + Math.sin(t * 2 + i) * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const mx = cx + Math.cos(angle) * len * 0.5;
    const my = cy + Math.sin(angle) * len * 0.5;
    const ex = cx + Math.cos(angle + 0.2) * len;
    const ey = cy + Math.sin(angle + 0.2) * len;
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();
  }

  // Enemy shadows (dark circles moving inward)
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2 + t * 0.3;
    const dist = 200 - (t * 15 + i * 8) % 200;
    const ex = cx + Math.cos(angle) * dist;
    const ey = cy + Math.sin(angle) * dist;
    const size = 6 + Math.sin(i * 2.3) * 3;

    // Enemy body
    ctx.fillStyle = `rgba(60, 20, 80, ${0.5 + 0.3 * (1 - dist / 200)})`;
    ctx.beginPath();
    ctx.arc(ex, ey, size, 0, Math.PI * 2);
    ctx.fill();

    // Red eye
    ctx.fillStyle = `rgba(255, 50, 50, ${0.6 * (1 - dist / 200)})`;
    ctx.beginPath();
    ctx.arc(ex, ey - 1, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fading light orbs (weavers dying)
  for (let i = 0; i < 6; i++) {
    const ox = cx + Math.cos(i * 1.1 + 0.5) * 120;
    const oy = cy + Math.sin(i * 1.7 + 0.3) * 80;
    const fade = Math.max(0, 1 - (t * 0.2 + i * 0.3) % 2);
    if (fade > 0) {
      const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, 15);
      grad.addColorStop(0, `rgba(244, 232, 193, ${fade * 0.6})`);
      grad.addColorStop(1, `rgba(244, 232, 193, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ox, oy, 15, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawCrystal(ctx, w, h, t) {
  // Wizard channeling energy into a growing crystal
  const cx = w / 2, cy = h / 2;

  // Wizard figure (left of center)
  const wx = cx - 80, wy = cy + 20;

  // Wizard robe
  ctx.fillStyle = '#1a237e';
  ctx.beginPath();
  ctx.arc(wx, wy + 4, 18, 0.2, Math.PI - 0.2);
  ctx.fill();

  // Wizard body
  ctx.fillStyle = '#7eb8da';
  ctx.beginPath();
  ctx.arc(wx, wy, 16, 0, Math.PI * 2);
  ctx.fill();

  // Wizard hat
  ctx.fillStyle = '#1a1a4e';
  ctx.beginPath();
  ctx.moveTo(wx - 14, wy - 16);
  ctx.quadraticCurveTo(wx - 2, wy - 22, wx + 3, wy - 34);
  ctx.quadraticCurveTo(wx + 2, wy - 22, wx + 14, wy - 16);
  ctx.closePath();
  ctx.fill();

  // Energy beam from wizard to crystal
  const crystalX = cx + 60, crystalY = cy;
  const beamAlpha = 0.3 + 0.3 * Math.sin(t * 4);
  ctx.strokeStyle = `rgba(126, 184, 218, ${beamAlpha})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(wx + 16, wy);
  ctx.lineTo(crystalX, crystalY);
  ctx.stroke();

  // Energy particles along beam
  for (let i = 0; i < 10; i++) {
    const progress = ((t * 0.8 + i * 0.1) % 1);
    const px = wx + 16 + (crystalX - wx - 16) * progress;
    const py = wy + (crystalY - wy) * progress + Math.sin(progress * Math.PI * 3 + t * 5) * 8;
    const alpha = 0.4 + 0.4 * Math.sin(t * 3 + i);
    ctx.fillStyle = `rgba(126, 220, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Crystal (diamond shape, pulsing)
  const cSize = 20 + Math.sin(t * 2) * 4;
  ctx.save();
  ctx.translate(crystalX, crystalY);

  // Crystal glow
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, cSize * 2);
  glow.addColorStop(0, 'rgba(0, 229, 255, 0.3)');
  glow.addColorStop(1, 'rgba(0, 229, 255, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, cSize * 2, 0, Math.PI * 2);
  ctx.fill();

  // Crystal body
  ctx.beginPath();
  ctx.moveTo(0, -cSize);
  ctx.lineTo(cSize * 0.7, 0);
  ctx.lineTo(0, cSize);
  ctx.lineTo(-cSize * 0.7, 0);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0, 229, 255, 0.8)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Swirling particles around crystal
  for (let i = 0; i < 15; i++) {
    const angle = t * 1.5 + (i / 15) * Math.PI * 2;
    const dist = 30 + Math.sin(t + i * 2) * 10;
    const px = crystalX + Math.cos(angle) * dist;
    const py = crystalY + Math.sin(angle) * dist;
    ctx.fillStyle = `rgba(0, 229, 255, ${0.3 + 0.2 * Math.sin(t * 2 + i)})`;
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRebirth(ctx, w, h, t) {
  // Wizard lying on ground, crystal pulsing beside him, empty field
  const cx = w / 2, cy = h / 2;

  // Ground line
  const groundY = cy + 40;
  ctx.strokeStyle = 'rgba(126, 184, 218, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 200, groundY);
  ctx.lineTo(cx + 200, groundY);
  ctx.stroke();

  // Wizard (rising animation based on time)
  const rise = Math.min(1, t * 0.3);
  const wx = cx - 40;
  const wy = groundY - 16 * rise;

  // If rising, draw upright; otherwise draw prone
  ctx.save();
  ctx.translate(wx, wy);
  ctx.rotate((1 - rise) * -Math.PI / 2);

  // Robe
  ctx.fillStyle = '#1a237e';
  ctx.beginPath();
  ctx.arc(0, 4, 18, 0.2, Math.PI - 0.2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#7eb8da';
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();

  // Hat
  ctx.fillStyle = '#1a1a4e';
  ctx.beginPath();
  ctx.moveTo(-14, -16);
  ctx.quadraticCurveTo(-2, -22, 3, -34);
  ctx.quadraticCurveTo(2, -22, 14, -16);
  ctx.closePath();
  ctx.fill();

  // Hat sparkle
  const sparkle = 0.5 + 0.5 * Math.sin(t * 3);
  ctx.fillStyle = `rgba(255, 215, 0, ${sparkle})`;
  ctx.beginPath();
  ctx.arc(3, -34, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Crystal beside wizard (pulsing)
  const crx = cx + 40, cry = groundY - 15;
  const pulse = 1 + Math.sin(t * 2.5) * 0.15;
  const cSize = 15 * pulse;

  // Crystal glow
  const glow = ctx.createRadialGradient(crx, cry, 0, crx, cry, 40);
  glow.addColorStop(0, `rgba(0, 229, 255, ${0.15 + 0.1 * Math.sin(t * 2.5)})`);
  glow.addColorStop(1, 'rgba(0, 229, 255, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(crx, cry, 40, 0, Math.PI * 2);
  ctx.fill();

  // Crystal
  ctx.beginPath();
  ctx.moveTo(crx, cry - cSize);
  ctx.lineTo(crx + cSize * 0.7, cry);
  ctx.lineTo(crx, cry + cSize);
  ctx.lineTo(crx - cSize * 0.7, cry);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0, 229, 255, 0.8)';
  ctx.fill();

  // Floating light particles
  for (let i = 0; i < 12; i++) {
    const px = cx + Math.sin(i * 5.3 + t * 0.4) * 150;
    const py = cy + Math.cos(i * 3.7 + t * 0.3) * 60 - 20;
    const alpha = 0.15 + 0.15 * Math.sin(t + i * 2);
    ctx.fillStyle = `rgba(244, 232, 193, ${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWhisper(ctx, w, h, t) {
  // Crystal in center, enemy silhouettes approaching from edges
  const cx = w / 2, cy = h / 2;

  // Crystal (center, large, pulsing)
  const cSize = 25 + Math.sin(t * 2) * 5;
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
  glow.addColorStop(0, 'rgba(0, 229, 255, 0.25)');
  glow.addColorStop(1, 'rgba(0, 229, 255, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, 60, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx, cy - cSize);
  ctx.lineTo(cx + cSize * 0.7, cy);
  ctx.lineTo(cx, cy + cSize);
  ctx.lineTo(cx - cSize * 0.7, cy);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0, 229, 255, 0.8)';
  ctx.fill();

  // Enemy silhouettes approaching
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2 + t * 0.1;
    const maxDist = 220;
    const dist = maxDist - ((t * 20 + i * 12) % maxDist);
    const ex = cx + Math.cos(angle) * dist;
    const ey = cy + Math.sin(angle) * dist;
    const size = 8 + (i % 3) * 3;
    const alpha = 0.2 + 0.3 * (1 - dist / maxDist);

    // Dark shadow body
    ctx.fillStyle = `rgba(40, 10, 60, ${alpha})`;
    ctx.beginPath();
    ctx.arc(ex, ey, size, 0, Math.PI * 2);
    ctx.fill();

    // Red eyes
    ctx.fillStyle = `rgba(255, 50, 50, ${alpha * 0.8})`;
    ctx.beginPath();
    ctx.arc(ex - 3, ey - 2, 1.5, 0, Math.PI * 2);
    ctx.arc(ex + 3, ey - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wizard near crystal (small, defending stance)
  const wx = cx - 35, wy = cy + 5;
  ctx.fillStyle = '#1a237e';
  ctx.beginPath();
  ctx.arc(wx, wy + 3, 12, 0.2, Math.PI - 0.2);
  ctx.fill();
  ctx.fillStyle = '#7eb8da';
  ctx.beginPath();
  ctx.arc(wx, wy, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a4e';
  ctx.beginPath();
  ctx.moveTo(wx - 9, wy - 10);
  ctx.quadraticCurveTo(wx - 1, wy - 15, wx + 2, wy - 24);
  ctx.quadraticCurveTo(wx + 1, wy - 15, wx + 9, wy - 10);
  ctx.closePath();
  ctx.fill();

  // Defensive spell aura
  const auraR = 45 + Math.sin(t * 3) * 5;
  ctx.strokeStyle = `rgba(126, 184, 218, ${0.2 + 0.1 * Math.sin(t * 2)})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, auraR, 0, Math.PI * 2);
  ctx.stroke();
}

function drawTitle(ctx, w, h, t) {
  // Dramatic particles converging to center
  const cx = w / 2, cy = h / 2;

  // Particle burst from center
  for (let i = 0; i < 30; i++) {
    const angle = (i / 30) * Math.PI * 2;
    const dist = 30 + Math.sin(t * 2 + i * 0.7) * 20 + (t * 8 + i * 3) % 120;
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;
    const alpha = Math.max(0, 0.5 - dist / 200);
    const color = i % 3 === 0 ? '0, 229, 255' : i % 3 === 1 ? '126, 184, 218' : '244, 232, 193';
    ctx.fillStyle = `rgba(${color}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, 2 + Math.sin(t + i) * 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Central crystal glow
  const pulse = 1 + Math.sin(t * 2) * 0.2;
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80 * pulse);
  glow.addColorStop(0, 'rgba(0, 229, 255, 0.15)');
  glow.addColorStop(0.5, 'rgba(126, 184, 218, 0.05)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, 80 * pulse, 0, Math.PI * 2);
  ctx.fill();
}

const ANIMATION_MAP = { spire: drawSpire, void: drawVoid, crystal: drawCrystal, rebirth: drawRebirth, whisper: drawWhisper, title: drawTitle };

const CutsceneOverlay = ({ onComplete }) => {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [fadeState, setFadeState] = useState('in');
  const [exiting, setExiting] = useState(false);
  const transitioningRef = useRef(false);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const sceneStartRef = useRef(Date.now());

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    sceneStartRef.current = Date.now();

    const animate = () => {
      const t = (Date.now() - sceneStartRef.current) / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const scene = SCENES[sceneIndex];
      const drawFn = ANIMATION_MAP[scene?.animation];
      if (drawFn) {
        ctx.save();
        drawFn(ctx, canvas.width, canvas.height, t);
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [sceneIndex]);

  const advanceScene = useCallback(() => {
    if (transitioningRef.current || exiting) return;
    transitioningRef.current = true;

    if (sceneIndex >= SCENES.length - 1) {
      setExiting(true);
      setFadeState('out');
      setTimeout(() => onComplete(), 1000);
      return;
    }

    setFadeState('out');
    setTimeout(() => {
      setFadeState('black');
      setTimeout(() => {
        setSceneIndex((i) => i + 1);
        sceneStartRef.current = Date.now();
        setFadeState('in');
        transitioningRef.current = false;
      }, 300);
    }, 800);
  }, [sceneIndex, exiting, onComplete]);

  const skip = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    setFadeState('out');
    setTimeout(() => onComplete(), 800);
  }, [exiting, onComplete]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        skip();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        advanceScene();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [advanceScene, skip]);

  const scene = SCENES[sceneIndex];
  const textOpacity = fadeState === 'in' ? 1 : 0;
  const textTransition = fadeState === 'black' ? 'none' : 'opacity 0.8s ease-in-out, transform 0.8s ease-in-out';
  const textTransform = fadeState === 'in' ? 'translateY(0)' : 'translateY(12px)';

  return (
    <div
      onClick={advanceScene}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#0a0a12',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {/* Canvas animation layer */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />

      {/* Text overlay */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          width: '100%',
          height: '100%',
          paddingBottom: '20vh',
        }}
      >
        <div
          style={{
            opacity: textOpacity,
            transition: textTransition,
            transform: textTransform,
            maxWidth: '700px',
            padding: '0 40px',
            textAlign: 'center',
          }}
        >
          {scene.title ? (
            <>
              <h1 style={{
                fontFamily: "'Cinzel Decorative', cursive", fontSize: '3.5rem', color: '#f4e8c1',
                textShadow: '0 0 30px rgba(126, 184, 218, 0.3), 0 0 60px rgba(126, 184, 218, 0.1)',
                marginBottom: '16px', fontWeight: 400, letterSpacing: '0.1em',
              }}>{scene.text}</h1>
              <p style={{
                fontFamily: "'Cinzel Decorative', cursive", fontSize: '1.8rem', color: '#7eb8da',
                textShadow: '0 0 20px rgba(126, 184, 218, 0.2)', fontWeight: 300, letterSpacing: '0.15em',
              }}>{scene.subtext}</p>
            </>
          ) : (
            <>
              <p style={{
                fontFamily: scene.emphasis ? "'Cinzel Decorative', cursive" : "'Cormorant Garamond', serif",
                fontSize: scene.emphasis ? '1.6rem' : '1.5rem',
                color: scene.emphasis ? '#7eb8da' : '#f4e8c1',
                textShadow: scene.emphasis ? '0 0 20px rgba(126, 184, 218, 0.3)' : '0 0 8px rgba(126, 184, 218, 0.15)',
                lineHeight: 1.8, marginBottom: '28px',
                fontWeight: scene.emphasis ? 400 : 300,
                fontStyle: scene.emphasis ? 'italic' : 'normal',
                letterSpacing: scene.emphasis ? '0.05em' : '0.02em',
              }}>{scene.text}</p>
              <p style={{
                fontFamily: "'Cormorant Garamond', serif", fontSize: '1.15rem',
                color: '#a8a8b2', lineHeight: 1.9, fontWeight: 300,
              }}>{scene.subtext}</p>
            </>
          )}
        </div>
      </div>

      {/* Bottom prompt */}
      <div style={{
        position: 'absolute', bottom: '48px', left: 0, right: 0, textAlign: 'center',
        opacity: exiting ? 0 : 0.5, transition: 'opacity 0.5s', zIndex: 2,
        animation: 'cutscene-pulse 2.5s ease-in-out infinite',
      }}>
        <span style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: '0.85rem', color: '#7eb8da',
          letterSpacing: '0.2em', textTransform: 'uppercase',
        }}>Press Space to continue &nbsp;&middot;&nbsp; ESC to skip</span>
      </div>

      {/* Skip button */}
      <button
        onClick={(e) => { e.stopPropagation(); skip(); }}
        style={{
          position: 'absolute', top: '32px', right: '40px', background: 'none', zIndex: 2,
          border: '1px solid rgba(126, 184, 218, 0.3)', color: '#7eb8da',
          fontFamily: "'Cormorant Garamond', serif", fontSize: '0.85rem',
          letterSpacing: '0.15em', textTransform: 'uppercase', padding: '8px 20px',
          cursor: 'pointer', opacity: exiting ? 0 : 0.6, transition: 'opacity 0.3s, border-color 0.3s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.borderColor = 'rgba(126, 184, 218, 0.6)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.borderColor = 'rgba(126, 184, 218, 0.3)'; }}
      >Skip</button>

      <style>{`
        @keyframes cutscene-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default CutsceneOverlay;
