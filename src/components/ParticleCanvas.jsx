import React, { useRef, useEffect, useState } from 'react';

const ParticleCanvas = () => {
  const canvasRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const mousePosRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const particlesRef = useRef([]);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const particleCount = 120;
    const colors = ['rgba(126, 184, 218, ', 'rgba(244, 232, 193, ', 'rgba(74, 143, 143, '];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.2;
        this.size = Math.random() * 2 + 0.5;
        this.colorBase = colors[Math.floor(Math.random() * colors.length)];
        this.alpha = 0;
        this.targetAlpha = Math.random() * 0.6 + 0.1;
        this.life = 0;
        this.maxLife = Math.random() * 300 + 200;
        this.originalVx = this.vx;
        this.originalVy = this.vy;
        this.friction = 0.96;
      }

      update() {
        const dx = mousePosRef.current.x - this.x;
        const dy = mousePosRef.current.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const interactionRadius = 250;

        if (dist < interactionRadius) {
          const force = (interactionRadius - dist) / interactionRadius;
          const angle = Math.atan2(dy, dx);
          this.vx -= Math.cos(angle) * force * 0.5;
          this.vy -= Math.sin(angle) * force * 0.5;
        }

        this.x += this.vx;
        this.y += this.vy;
        this.vx = this.vx * this.friction + this.originalVx * (1 - this.friction);
        this.vy = this.vy * this.friction + this.originalVy * (1 - this.friction);
        this.life++;

        if (this.life < 50) {
          this.alpha += 0.01;
        } else if (this.life > this.maxLife - 50) {
          this.alpha -= 0.01;
        }

        if (Math.random() > 0.98) {
          this.alpha = Math.max(0, this.alpha - 0.2);
        }

        if (this.life >= this.maxLife || this.alpha <= 0) {
          this.reset();
          this.life = 0;
          this.alpha = 0;
        }

        if (this.x < -50) this.x = canvas.width + 50;
        if (this.x > canvas.width + 50) this.x = -50;
        if (this.y < -50) this.y = canvas.height + 50;
        if (this.y > canvas.height + 50) this.y = -50;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.colorBase + this.alpha + ')';
        ctx.fill();
      }
    }

    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push(new Particle());
    }

    mousePosRef.current.targetX = window.innerWidth / 2;
    mousePosRef.current.targetY = window.innerHeight / 2;
    mousePosRef.current.x = mousePosRef.current.targetX;
    mousePosRef.current.y = mousePosRef.current.targetY;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const ease = 0.1;
      mousePosRef.current.x += (mousePosRef.current.targetX - mousePosRef.current.x) * ease;
      mousePosRef.current.y += (mousePosRef.current.targetY - mousePosRef.current.y) * ease;

      particlesRef.current.forEach((p) => {
        p.update();
        p.draw();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleMouseMove = (e) => {
      mousePosRef.current.targetX = e.clientX;
      mousePosRef.current.targetY = e.clientY;
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-20 w-full h-full pointer-events-none" />;
};

export default ParticleCanvas;
