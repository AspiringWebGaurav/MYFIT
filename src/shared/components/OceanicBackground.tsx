import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate, useReducedMotion } from 'framer-motion';

export interface OceanicBackgroundProps {
  isAuthLoading?: boolean;
  interactive?: boolean;
  variant?: 'full' | 'subtle';
}

export function OceanicBackground({ 
  isAuthLoading = false, 
  interactive = true, 
  variant = 'full' 
}: OceanicBackgroundProps) {
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number, left: string, top: string, duration: number, delay: number, size: number }>>([]);
  const [isLowEnd, setIsLowEnd] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  
  // High-performance cursor tracking
  const mouseX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth / 2 : 960);
  const mouseY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight / 2 : 540);
  
  // Smooth spring physics for premium parallax feel
  const smoothMouseX = useSpring(mouseX, { damping: 50, stiffness: 300, mass: 0.5 });
  const smoothMouseY = useSpring(mouseY, { damping: 50, stiffness: 300, mass: 0.5 });

  // Parallax layer transforms
  const normX = useTransform(smoothMouseX, (v) => interactive ? (v - (typeof window !== 'undefined' ? window.innerWidth / 2 : 960)) / 100 : 0);
  const normY = useTransform(smoothMouseY, (v) => interactive ? (v - (typeof window !== 'undefined' ? window.innerHeight / 2 : 540)) / 100 : 0);

  const bgParallaxX = useTransform(normX, (v) => v * -2);
  const bgParallaxY = useTransform(normY, (v) => v * -2);
  
  const waveParallaxX = useTransform(normX, (v) => v * -5);
  const waveParallaxY = useTransform(normY, (v) => v * -5);

  const orbParallaxX = useTransform(normX, (v) => v * 4);
  const orbParallaxY = useTransform(normY, (v) => v * 4);

  // Dynamic spotlight gradient tied to smooth mouse position for cinematic cursor atmosphere
  // If not interactive, we can center the spotlight
  const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 960;
  const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 540;
  
  const activeX = interactive ? smoothMouseX : centerX;
  const activeY = interactive ? smoothMouseY : centerY;

  const spotlightBackground = useMotionTemplate`radial-gradient(1200px circle at ${activeX}px ${activeY}px, rgba(45, 212, 191, 0.12), transparent 50%)`;
  const subtleSpotlightBackground = useMotionTemplate`radial-gradient(600px circle at ${activeX}px ${activeY}px, rgba(6, 182, 212, 0.18), transparent 50%)`;
  const cursorGlow = useMotionTemplate`radial-gradient(250px circle at ${activeX}px ${activeY}px, rgba(255, 255, 255, 0.08), transparent 70%)`;

  useEffect(() => {
    setMounted(true);
    let particleCount = 30;
    if (typeof navigator !== 'undefined') {
      const nav = navigator as unknown as { hardwareConcurrency?: number, deviceMemory?: number };
      const lowEnd = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
      setIsLowEnd(lowEnd);
      
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      if (lowEnd || mobile) particleCount = mobile ? 8 : 12;
    }

    setParticles(
      [...Array(particleCount)].map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        duration: Math.random() * 15 + 25,
        delay: Math.random() * 5,
        size: Math.random() * 3 + 1.5
      }))
    );
    
    if (typeof window !== 'undefined') {
      mouseX.set(window.innerWidth / 2);
      mouseY.set(window.innerHeight / 2);
    }
  }, [mouseX, mouseY]);

  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseX.set(e.touches[0].clientX);
        mouseY.set(e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [interactive, mouseX, mouseY]);

  const opacityMultiplier = variant === 'subtle' ? 0.4 : 1;

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Base dark ambient gradient with slight parallax */}
      <motion.div 
        style={{ x: bgParallaxX, y: bgParallaxY }}
        className="absolute -inset-10 bg-gradient-to-br from-[#020B1A] via-[#041222] to-[#010a14]" 
      />
      
      {/* Slow Atmospheric Drift Layer */}
      {!prefersReducedMotion && !isLowEnd && (
        <motion.div
          animate={{ 
            x: ["-5%", "5%", "-5%"],
            y: ["-2%", "2%", "-2%"]
          }}
          transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: opacityMultiplier }}
        >
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.12)_0%,transparent_70%)] blur-[100px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.12)_0%,transparent_70%)] blur-[100px]" />
        </motion.div>
      )}
      
      {/* Interactive Mouse Spotlight & Cursor Atmosphere */}
      {interactive && (
        <>
          <motion.div
            className="absolute inset-0 z-0 mix-blend-screen pointer-events-none"
            style={{ background: spotlightBackground }}
          />
          <motion.div
            className="absolute inset-0 z-0 mix-blend-screen pointer-events-none"
            style={{ background: subtleSpotlightBackground }}
          />
          {!prefersReducedMotion && (
            <motion.div
              className="absolute inset-0 z-10 mix-blend-screen pointer-events-none"
              style={{ background: cursorGlow }}
            />
          )}
        </>
      )}

      {/* Cinematic depth lighting - Only on desktop to save mobile GPU fill rate */}
      {!isMobile && (
        <>
          <div 
            className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-cyan-600/15 to-transparent blur-3xl mix-blend-screen"
            style={{ opacity: opacityMultiplier }} 
          />
          <div 
            className="absolute bottom-0 inset-x-0 h-[500px] bg-gradient-to-t from-teal-500/15 to-transparent blur-3xl mix-blend-screen"
            style={{ opacity: opacityMultiplier }} 
          />
        </>
      )}

      {/* Glowing Orbs - Cinematic depth with parallax */}
      {!isLowEnd && !isMobile && (
        <>
          <motion.div
            style={{ x: orbParallaxX, y: orbParallaxY, opacity: opacityMultiplier }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.2 * opacityMultiplier, 0.4 * opacityMultiplier, 0.2 * opacityMultiplier] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[5%] left-[10%] w-[1000px] h-[1000px] bg-teal-500/15 rounded-full blur-[140px] mix-blend-screen"
          />
          <motion.div
            style={{ x: orbParallaxX, y: orbParallaxY, opacity: opacityMultiplier }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.15 * opacityMultiplier, 0.35 * opacityMultiplier, 0.15 * opacityMultiplier] }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-[-5%] right-[5%] w-[1200px] h-[1200px] bg-cyan-600/15 rounded-full blur-[160px] mix-blend-screen"
          />
        </>
      )}

      {/* Cinematic Wave Lines (SVG) with Parallax */}
      <motion.svg 
        style={{ x: waveParallaxX, y: waveParallaxY }}
        animate={{ opacity: isAuthLoading ? 0.3 * opacityMultiplier : 0.9 * opacityMultiplier }}
        transition={{ duration: 1 }}
        className="absolute -inset-10 w-[110%] h-[110%] mix-blend-screen pointer-events-none" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0" />
            <stop offset="20%" stopColor="#2DD4BF" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.9" />
            <stop offset="80%" stopColor="#0ea5e9" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0" />
            <stop offset="30%" stopColor="#06B6D4" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#2DD4BF" stopOpacity="0.8" />
            <stop offset="90%" stopColor="#22D3EE" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="waveGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="40%" stopColor="#06B6D4" stopOpacity="0.3" />
            <stop offset="70%" stopColor="#2DD4BF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Back slow wave - Hidden on mobile to reduce SVG overdraw */}
        {!isMobile && (
          <motion.path
            d="M-10,65 Q25,35 50,65 T110,65"
            fill="none"
            stroke="url(#waveGrad3)"
            strokeWidth="0.8"
            style={{ filter: "blur(4px)" }}
            animate={{ d: ["M-10,65 Q25,35 50,65 T110,65", "M-10,65 Q25,95 50,65 T110,65", "M-10,65 Q25,35 50,65 T110,65"] }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        
        {/* Mid prominent wave - Hidden on mobile */}
        {!isMobile && (
          <motion.path
            d="M-10,75 Q25,45 50,75 T110,75"
            fill="none"
            stroke="url(#waveGrad)"
            strokeWidth="0.4"
            style={{ filter: "blur(2px)" }}
            animate={{ d: ["M-10,75 Q25,45 50,75 T110,75", "M-10,75 Q25,105 50,75 T110,75", "M-10,75 Q25,45 50,75 T110,75"] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
        )}
        
        {/* Front sharp wave - Keeping this single wave for mobile */}
        <motion.path
          d="M-10,85 Q30,65 60,85 T110,85"
          fill="none"
          stroke="url(#waveGrad2)"
          strokeWidth="0.15"
          animate={{ d: ["M-10,85 Q30,65 60,85 T110,85", "M-10,85 Q30,115 60,85 T110,85", "M-10,85 Q30,65 60,85 T110,85"] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
      </motion.svg>

      {/* Particles with subtle mouse drift */}
      {mounted && !prefersReducedMotion && particles.map((p) => (
        <motion.div
          key={p.id}
          className={`absolute rounded-full animate-float ${!isMobile ? 'mix-blend-screen' : ''}`}
          style={{
            left: p.left,
            top: p.top,
            width: p.size + 'px',
            height: p.size + 'px',
            backgroundColor: p.id % 2 === 0 ? '#2DD4BF' : '#06B6D4',
            boxShadow: `0 0 ${p.size * 4}px ${p.id % 2 === 0 ? 'rgba(45,212,191,0.6)' : 'rgba(6,182,212,0.6)'}`,
            x: orbParallaxX,
            y: orbParallaxY,
            '--duration': `${isAuthLoading ? p.duration * 1.5 : p.duration}s`,
            '--delay': `${p.delay}s`,
            '--max-opacity': isAuthLoading ? 0.3 * opacityMultiplier : 0.8 * opacityMultiplier
          } as unknown as React.CSSProperties}
        />
      ))}

      {/* Subtle vignette layer */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,11,26,0.85)_100%)] pointer-events-none" />
    </div>
  );
}
