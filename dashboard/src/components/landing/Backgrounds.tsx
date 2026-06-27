import React from 'react';
import { motion } from 'motion/react';

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED GRADIENT ORB
// ═══════════════════════════════════════════════════════════════════════════════

export const GradientOrb: React.FC<{ delay?: number; color1?: string; color2?: string; size?: number; x?: string; y?: string }> = ({
  delay = 0, color1 = 'rgba(255,59,59,0.12)', color2 = 'rgba(139,92,246,0.08)', size = 500, x = '50%', y = '30%',
}) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{
      scale: [0.8, 1.1, 0.9, 1],
      opacity: [0, 0.6, 0.4, 0.6],
    }}
    transition={{
      duration: 8,
      repeat: Infinity,
      ease: 'easeInOut',
      delay,
    }}
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color1} 0%, ${color2} 50%, transparent 70%)`,
      filter: 'blur(60px)',
      pointerEvents: 'none',
      zIndex: 0,
      transform: 'translate(-50%, -50%)',
    }}
  />
);
