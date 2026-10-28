import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';

/**
 * Hero3DComposition
 * 
 * Abstract 3D Sculptural Motion Composition for the CIVNEXA landing hero.
 * Engineered using pure CSS 3D perspective and Framer Motion spring physics.
 * 
 * Features flowing interlocking ribbons, layered curved geometric bands,
 * and translucent sculptural facets floating directly within the rich hero canvas.
 * 
 * Strictly contains NO dashboard cards, NO tables, NO fake status badges, NO text labels,
 * NO orbs, NO robots, and NO stock photographs.
 */
export const Hero3DComposition = () => {
  const containerRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  // Mouse coordinate motion values normalized from -0.5 to 0.5
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring physics for silky, non-jarring tilt
  const springConfig = { damping: 26, stiffness: 160, mass: 0.6 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // 3D Perspective Rotations (Degrees)
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-12, 12]);

  // Handle pointer tracking over container
  const handlePointerMove = (e) => {
    if (prefersReducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handlePointerLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="cx-perspective-wrapper position-relative w-100 d-flex align-items-center justify-content-center py-4"
      style={{
        minHeight: '440px',
        perspective: '1200px',
        touchAction: 'pan-y',
      }}
      aria-hidden="true"
    >
      {/* Ambient Multi-Hue Depth Glow behind Sculpture */}
      <div
        className="position-absolute rounded-circle pointer-events-none"
        style={{
          width: '420px',
          height: '420px',
          background: 'radial-gradient(circle, rgba(13, 148, 136, 0.3) 0%, rgba(99, 102, 241, 0.18) 45%, transparent 70%)',
          filter: 'blur(45px)',
          transform: 'translateZ(-100px)',
          zIndex: 0,
        }}
      />

      {/* Interactive 3D Sculptural Scene */}
      <motion.div
        className="cx-preserve-3d position-relative d-flex align-items-center justify-content-center"
        style={{
          width: '100%',
          maxWidth: '480px',
          height: '400px',
          rotateX: prefersReducedMotion ? 0 : rotateX,
          rotateY: prefersReducedMotion ? 0 : rotateY,
          zIndex: 1,
        }}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Continuous Floating Oscillator Wrapper */}
        <motion.div
          className="cx-preserve-3d position-relative w-100 h-100 d-flex align-items-center justify-content-center"
          animate={prefersReducedMotion ? {} : {
            y: [-8, 8, -8],
            rotateZ: [-1.2, 1.2, -1.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Element 1: Deep Translucent Sculptural Facet (Z = -30px) */}
          <motion.div
            className="position-absolute"
            style={{
              width: '320px',
              height: '220px',
              borderRadius: '40px 140px 50px 120px',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(14, 116, 144, 0.6) 50%, rgba(99, 102, 241, 0.35) 100%)',
              border: '1px solid rgba(45, 212, 191, 0.3)',
              boxShadow: '0 30px 70px -15px rgba(7, 13, 30, 0.8), inset 0 0 40px rgba(45, 212, 191, 0.12)',
              transform: 'translateZ(-30px) rotateX(24deg) rotateY(16deg) rotateZ(-8deg)',
              backdropFilter: 'blur(12px)',
            }}
          />

          {/* Element 2: Interlocking Violet/Indigo Curved Ribbon (Z = +15px) */}
          <motion.div
            className="position-absolute"
            style={{
              width: '300px',
              height: '190px',
              borderRadius: '130px 45px 140px 55px',
              background: 'linear-gradient(140deg, rgba(99, 102, 241, 0.85) 0%, rgba(139, 92, 246, 0.75) 45%, rgba(45, 212, 191, 0.65) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 25px 60px -10px rgba(99, 102, 241, 0.45), inset 0 1px 3px rgba(255, 255, 255, 0.6)',
              transform: 'translateZ(15px) rotateX(-22deg) rotateY(28deg) rotateZ(-18deg)',
              backdropFilter: 'blur(10px)',
            }}
          />

          {/* Element 3: Primary Flowing Teal/Cyan 3D Ribbon (Z = +60px) */}
          <motion.div
            className="position-absolute"
            style={{
              width: '340px',
              height: '185px',
              borderRadius: '45px 150px 70px 140px',
              background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.92) 0%, rgba(45, 212, 191, 0.85) 50%, rgba(56, 189, 248, 0.85) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.45)',
              boxShadow: '0 30px 80px -15px rgba(13, 148, 136, 0.55), inset 0 2px 4px rgba(255, 255, 255, 0.8)',
              transform: 'translateZ(60px) rotateX(16deg) rotateY(-20deg) rotateZ(14deg)',
              backdropFilter: 'blur(10px)',
            }}
          />

          {/* Element 4: Floating Geometric Accent Facet (Z = +100px) */}
          <motion.div
            className="position-absolute"
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '28px',
              background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.95) 0%, rgba(6, 182, 212, 0.8) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              boxShadow: '0 20px 50px -10px rgba(6, 182, 212, 0.6), inset 0 1px 3px rgba(255, 255, 255, 0.9)',
              transform: 'translateZ(100px) translate3d(70px, -45px, 0) rotateX(-14deg) rotateY(-18deg) rotateZ(42deg)',
            }}
          />

          {/* Element 5: Secondary Floating Accent Band (Z = +115px) */}
          <motion.div
            className="position-absolute"
            style={{
              width: '160px',
              height: '42px',
              borderRadius: '9999px',
              background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.8) 0%, rgba(13, 148, 136, 0.9) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              boxShadow: '0 15px 35px -5px rgba(99, 102, 241, 0.5)',
              transform: 'translateZ(115px) translate3d(-80px, 60px, 0) rotateX(25deg) rotateY(-30deg) rotateZ(-12deg)',
            }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Hero3DComposition;