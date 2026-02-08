import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomCursor from '../components/CustomCursor';
import ParticleCanvas from '../components/ParticleCanvas';
import MenuLink from '../components/MenuLink';
import CutsceneOverlay from '../components/CutsceneOverlay';

const HomePage = () => {
  const navigate = useNavigate();
  const [transitioning, setTransitioning] = useState(false);
  const [showCutscene, setShowCutscene] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const parallaxRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const rafRef = useRef(null);

  const handleBeginJourney = useCallback(() => {
    setShowCutscene(true);
  }, []);

  const handleCutsceneComplete = useCallback(() => {
    setShowCutscene(false);
    setTransitioning(true);
    setTimeout(() => navigate('/game'), 1200);
  }, [navigate]);

  // Mouse parallax effect - tracks mouse and smoothly shifts UI elements
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Normalize mouse position to [-1, 1] range from center
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      parallaxRef.current.targetX = nx;
      parallaxRef.current.targetY = ny;
    };

    const animate = () => {
      const ease = 0.06;
      parallaxRef.current.x += (parallaxRef.current.targetX - parallaxRef.current.x) * ease;
      parallaxRef.current.y += (parallaxRef.current.targetY - parallaxRef.current.y) * ease;
      setParallax({ x: parallaxRef.current.x, y: parallaxRef.current.y });
      rafRef.current = requestAnimationFrame(animate);
    };

    document.addEventListener('mousemove', handleMouseMove);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Different layers shift by different amounts for depth
  const bgShift = { x: parallax.x * -8, y: parallax.y * -8 };
  const sigil1Shift = { x: parallax.x * -15, y: parallax.y * -15 };
  const sigil2Shift = { x: parallax.x * 12, y: parallax.y * 12 };
  const contentShift = { x: parallax.x * -5, y: parallax.y * -5 };
  const navShift = { x: parallax.x * -3, y: parallax.y * -3 };

  return (
    <div className="w-full h-screen relative select-none m-20" style={{ backgroundColor: '#0a0a12', color: '#f4e8c1', cursor: 'none', overflow: 'hidden' }}>
      <CustomCursor />

      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a12] via-[#0f0f1a] to-[#080810]"></div>

        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vh] h-[120vh] opacity-[0.03] pointer-events-none"
          style={{ transform: `translate(calc(-50% + ${sigil1Shift.x}px), calc(-50% + ${sigil1Shift.y}px))` }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-[#7eb8da]" style={{ animation: 'rotate-slow 120s linear infinite' }}>
            <path d="M50 5 L55 20 L70 20 L60 30 L65 45 L50 35 L35 45 L40 30 L30 20 L45 20 Z"></path>
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 2"></circle>
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.2"></circle>
            <path d="M50 10 L50 90 M10 50 L90 50" stroke="currentColor" strokeWidth="0.2"></path>
            <path d="M22 22 L78 78 M78 22 L22 78" stroke="currentColor" strokeWidth="0.2"></path>
          </svg>
        </div>

        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vh] h-[80vh] opacity-[0.04] pointer-events-none"
          style={{ transform: `translate(calc(-50% + ${sigil2Shift.x}px), calc(-50% + ${sigil2Shift.y}px))` }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-[#f4e8c1]" style={{ strokeWidth: 0.3, animation: 'rotate-slow 180s linear infinite reverse' }}>
            <circle cx="50" cy="50" r="48" strokeDasharray="4 4"></circle>
            <rect x="25" y="25" width="50" height="50" transform="rotate(45 50 50)"></rect>
            <rect x="25" y="25" width="50" height="50"></rect>
          </svg>
        </div>

        <div
          className="absolute bottom-[-20%] left-[-20%] w-[80vw] h-[60vh] opacity-30"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(74, 143, 143, 0.1) 0%, transparent 70%)',
            filter: 'blur(40px)',
            animation: 'float 8s ease-in-out infinite',
            animationDelay: '-2s',
            transform: `translate(${bgShift.x}px, ${bgShift.y}px)`,
          }}
        ></div>
        <div
          className="absolute top-[-10%] right-[-10%] w-[60vw] h-[50vh] opacity-20"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(74, 143, 143, 0.1) 0%, transparent 70%)',
            filter: 'blur(40px)',
            animation: 'float 8s ease-in-out infinite',
            transform: `translate(${bgShift.x * -1}px, ${bgShift.y * -1}px)`,
          }}
        ></div>

        <div className="absolute bottom-0 w-full h-1/3 z-10 opacity-60">
          <svg className="w-full h-full text-[#050508] fill-current" preserveAspectRatio="none" viewBox="0 0 100 100">
            <path d="M0 100 L0 75 C10 75 15 70 20 72 C30 76 40 65 50 68 C60 71 70 60 80 65 C90 70 95 65 100 70 L100 100 Z" style={{ filter: 'blur(2px)', opacity: 0.8 }}></path>
            <path d="M0 100 L0 85 C15 85 25 80 35 82 C45 84 55 78 65 80 C75 82 85 75 100 80 L100 100 Z" style={{ opacity: 1 }}></path>
          </svg>
        </div>
      </div>

      <ParticleCanvas />

      <div
        className="relative z-30 flex flex-col justify-between p-16 lg:p-32"
        style={{ transform: `translate(${contentShift.x}px, ${contentShift.y}px)`, transition: 'transform 0.05s linear', margin: '60px', width: 'calc(100% - 120px)', height: 'calc(100% - 120px)' }}
      >
        <div className="flex justify-between items-start opacity-60" style={{ transform: `translate(${navShift.x * 0.5}px, ${navShift.y * 0.5}px)` }}>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full border border-[#4a8f8f] flex items-center justify-center opacity-70">
              <div className="w-1 h-1 bg-[#f4e8c1] rounded-full animate-pulse"></div>
            </div>
            <span className="font-cormorant text-xs tracking-[0.3em] text-[#7eb8da]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>SERVER: VOID_01</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="font-cormorant text-xs tracking-[0.2em] text-[#7eb8da]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>v.1.0.4.BETA</span>
            <div className="w-16 h-[1px] bg-gradient-to-l from-[#7eb8da] to-transparent opacity-50"></div>
          </div>
        </div>

        <div className="flex flex-row items-center w-full h-full">
          <div className="flex-1 flex flex-col justify-center items-start pl-12" style={{ transform: `translate(${parallax.x * -7}px, ${parallax.y * -4}px)` }}>
            <div className="w-1 h-24 bg-gradient-to-b from-transparent via-[#7eb8da] to-transparent mb-6 opacity-40 ml-2"></div>

            <h1 className="text-7xl lg:text-8xl text-[#f4e8c1] tracking-widest relative" style={{ fontFamily: "'Cinzel Decorative', cursive", fontWeight: 300, textShadow: '0 0 15px rgba(126, 184, 218, 0.2)' }}>
              AETHOS
              <span className="absolute -top-6 -right-6 text-2xl lg:text-4xl text-[#4a8f8f] opacity-40 italic tracking-normal" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Ep. I</span>
            </h1>

            <h2 className="text-xl lg:text-2xl text-[#7eb8da] tracking-[0.5em] mt-4 ml-2 opacity-70 uppercase" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}>
              Fragments of the Void
            </h2>

            <div className="mt-12 max-w-md text-[#a8a8b2] text-lg leading-relaxed opacity-60 ml-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              <p>The veil thins. The ancient sigils awaken once more. Step into the darkness and find what was lost.</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-end justify-center pr-12" style={{ transform: `translate(${parallax.x * -4}px, ${parallax.y * -6}px)` }}>
            <nav className="flex flex-col gap-6 text-right">
              <MenuLink subtitle="Continue from last save" onClick={handleBeginJourney}>
                <span className="block text-4xl lg:text-5xl text-[#e2dcc8]" style={{ fontFamily: "'Cinzel Decorative', cursive" }}>Begin Journey</span>
              </MenuLink>

              <MenuLink>
                <span className="block text-3xl lg:text-4xl text-[#8e8e99]" style={{ fontFamily: "'Cinzel Decorative', cursive" }}>Archives</span>
              </MenuLink>

              <MenuLink>
                <span className="block text-3xl lg:text-4xl text-[#8e8e99]" style={{ fontFamily: "'Cinzel Decorative', cursive" }}>Sigils</span>
              </MenuLink>

              <MenuLink>
                <span className="block text-3xl lg:text-4xl text-[#8e8e99]" style={{ fontFamily: "'Cinzel Decorative', cursive" }}>Settings</span>
              </MenuLink>

              <div className="h-12"></div>

              <MenuLink isDepart>
                <span className="block text-2xl lg:text-3xl text-[#5a5a66] hover:text-[#cd5c5c]" style={{ fontFamily: "'Cinzel Decorative', cursive" }}>Depart</span>
              </MenuLink>
            </nav>
          </div>
        </div>

        <div className="w-full flex justify-center opacity-40">
          <div className="w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-[#4a8f8f] to-transparent"></div>
        </div>
      </div>

      {/* Grain/noise texture overlay */}
      <div className="absolute inset-0 z-35 pointer-events-none" style={{ opacity: 0.3, mixBlendMode: 'overlay', overflow: 'hidden' }}>
        <svg style={{ position: 'fixed', width: '200%', height: '200%', top: '-50%', left: '-50%', animation: 'grain-shift 0.8s steps(8) infinite' }}>
          <filter id="grain-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain-filter)" />
        </svg>
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 z-40 pointer-events-none" style={{ background: 'radial-gradient(circle at center, transparent 30%, rgba(10, 10, 18, 0.6) 80%, #0a0a12 100%)' }}></div>

      {showCutscene && <CutsceneOverlay onComplete={handleCutsceneComplete} />}

      {/* Transition overlay — fades to black when navigating to game */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 9999,
          backgroundColor: '#0a0a12',
          opacity: transitioning ? 1 : 0,
          pointerEvents: transitioning ? 'all' : 'none',
          transition: 'opacity 1.2s ease-in-out',
        }}
      />
    </div>
  );
};

export default HomePage;
