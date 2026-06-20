import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  width?: 'fit-content' | '100%';
}

export const Reveal: React.FC<RevealProps> = ({ 
  children, 
  delay = 0, 
  direction = 'up',
  duration = 0.6,
  width = 'fit-content'
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  
  const getInitial = () => {
    switch (direction) {
      case 'up': return { opacity: 0, y: 40 };
      case 'down': return { opacity: 0, y: -40 };
      case 'left': return { opacity: 0, x: -40 };
      case 'right': return { opacity: 0, x: 40 };
      default: return { opacity: 0, y: 40 };
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative', width }}>
      <motion.div
        initial={getInitial()}
        animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
        transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%' }}
      >
        {children}
      </motion.div>
    </div>
  );
};
