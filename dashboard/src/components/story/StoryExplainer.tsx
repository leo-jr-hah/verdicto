import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Scene1Dispute, Scene2Investigation, Scene3Deliberation, Scene4Consensus, Scene5Verdict, Scene6OnChain } from './Scenes';

const SCENES = [
  {
    id: 'dispute',
    headline: "When AI agents disagree, trust becomes the problem.",
    component: Scene1Dispute
  },
  {
    id: 'investigate',
    headline: "Independent AI analysts gather evidence.",
    component: Scene2Investigation
  },
  {
    id: 'deliberation',
    headline: "Analysts challenge each other's conclusions.",
    component: Scene3Deliberation
  },
  {
    id: 'consensus',
    headline: "Every opinion is weighted by historical accuracy.",
    component: Scene4Consensus
  },
  {
    id: 'verdict',
    headline: "A verifiable verdict is produced.",
    component: Scene5Verdict
  },
  {
    id: 'onchain',
    headline: "The verdict becomes permanent.",
    component: Scene6OnChain
  }
];

export const StoryExplainer: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    setActiveStep(prev => Math.min(prev + 1, SCENES.length - 1));
  };

  const handlePrev = () => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  };

  return (
    <div 
      style={{ 
        position: 'relative', 
        background: 'var(--bg-main)',
        padding: '6rem 0'
      }}
      className="story-explainer-container"
    >
      <div className="container" style={{ width: '100%' }}>
        <div className="story-layout">
          
          {/* Left Column: Headlines */}
          <div className="story-text-column">
            <AnimatePresence mode="wait">
              <motion.h2
                key={activeStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ 
                  fontSize: '3rem', 
                  fontWeight: 600, 
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                  margin: 0,
                  minHeight: '150px' // Keep height stable across different headline lengths
                }}
              >
                {SCENES[activeStep].headline}
              </motion.h2>
            </AnimatePresence>
            
            {/* Progress Indicators and Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '3rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
              <div style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '300px' }}>
                {SCENES.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    style={{
                      height: '4px',
                      flex: 1,
                      background: idx === activeStep ? 'var(--primary)' : 'var(--border-color)',
                      borderRadius: '2px',
                      transition: 'background 0.3s ease',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0
                    }}
                    aria-label={`Go to scene ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Navigation Controls */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  onClick={handlePrev}
                  disabled={activeStep === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: activeStep === 0 ? 'transparent' : 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    color: activeStep === 0 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    cursor: activeStep === 0 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={handleNext}
                  disabled={activeStep === SCENES.length - 1}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: activeStep === SCENES.length - 1 ? 'transparent' : 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    color: activeStep === SCENES.length - 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    cursor: activeStep === SCENES.length - 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Visualization Stage */}
          <div className="story-visual-column">
            <div style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1/1',
              maxHeight: '600px',
              background: 'var(--bg-surface)',
              borderRadius: '24px',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-md)'
            }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} // smooth spring-like easing
                  style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                >
                  {React.createElement(SCENES[activeStep].component)}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .story-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6rem;
          align-items: center;
        }
        
        .story-text-column {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .story-text-column button:hover:not(:disabled) {
          background: var(--border-color);
          color: var(--text-primary);
        }

        @media (max-width: 900px) {
          .story-layout {
            grid-template-columns: 1fr;
            gap: 2rem;
            padding-top: 2rem;
          }
          .story-text-column h2 {
            fontSize: 2rem !important;
            min-height: 80px;
          }
          .story-visual-column {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
