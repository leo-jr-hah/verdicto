import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  term: string;
  explanation: string;
  children?: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ term, explanation, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="tooltip-container"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      style={{ display: 'inline-flex', alignItems: 'center', position: 'relative', cursor: 'help' }}
    >
      <span style={{ borderBottom: '1px dashed var(--text-tertiary)' }}>
        {children || term}
      </span>
      <HelpCircle size={14} style={{ marginLeft: '4px', color: 'var(--text-tertiary)' }} />

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: '8px',
              padding: '8px 12px',
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '0.8rem',
              color: 'var(--text-primary)',
              width: 'max-content',
              maxWidth: '250px',
              zIndex: 100,
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              lineHeight: 1.4,
              pointerEvents: 'none'
            }}
          >
            {explanation}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
