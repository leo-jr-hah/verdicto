import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

export const GradientOrb: React.FC<{ size?: number; x?: string | number; y?: string | number; delay?: number }> = ({ 
  size = 600, 
  x = '50%', 
  y = '40%',
  delay = 0 
}) => {
  return (
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: [0.9, 1.05, 0.9] }}
      transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay }}
      style={{
        position: 'absolute',
        width: size,
        height: size,
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(circle, rgba(255,59,59,0.06) 0%, rgba(255,255,255,0) 70%)',
        filter: 'blur(80px)',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};

export const DotGrid: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        // Calculate relative to the viewport
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        containerRef.current.style.setProperty('--mouse-x', `${x}px`);
        containerRef.current.style.setProperty('--mouse-y', `${y}px`);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        // Default position offscreen if no mouse move
        '--mouse-x': '-1000px',
        '--mouse-y': '-1000px',
      } as React.CSSProperties}
    >
      <svg width="100%" height="100%">
        <defs>
          <pattern id="dot-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="2" fill="rgba(255,59,59,0.08)" />
          </pattern>
          
          <radialGradient id="mouse-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,59,59,0.25)" />
            <stop offset="100%" stopColor="rgba(255,59,59,0)" />
          </radialGradient>
          
          <mask id="mouse-mask">
            <circle cx="var(--mouse-x)" cy="var(--mouse-y)" r="150" fill="url(#mouse-glow)" />
          </mask>
        </defs>
        
        {/* Base Grid */}
        <rect x="0" y="0" width="100%" height="100%" fill="url(#dot-grid)" />
        
        {/* Mouse Reactive Overlay */}
        <g mask="url(#mouse-mask)">
          {/* We create a slightly scaled up pattern for the hover effect */}
          <pattern id="dot-grid-hover" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="3" fill="rgba(255,59,59,1)" />
          </pattern>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#dot-grid-hover)" />
        </g>
      </svg>
    </div>
  );
};
