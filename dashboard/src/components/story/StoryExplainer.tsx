import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Scene1Dispute, Scene2Investigation, Scene3Deliberation, Scene4Consensus, Scene5Verdict, Scene6OnChain } from './Scenes';

// Custom hook for typewriter animation
const useTypewriter = (text: string, speed: number = 50, isActive: boolean = true) => {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setDisplayText(text);
      setIsComplete(true);
      return;
    }

    setDisplayText('');
    setIsComplete(false);
    
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1));
        i++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, isActive]);

  return { displayText, isComplete };
};

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
  const [isTyping, setIsTyping] = useState(true);
  const { displayText, isComplete } = useTypewriter(SCENES[activeStep].headline, 40, isTyping);

  const handleNext = () => {
    setActiveStep(prev => Math.min(prev + 1, SCENES.length - 1));
    setIsTyping(true);
  };

  const handlePrev = () => {
    setActiveStep(prev => Math.max(prev - 1, 0));
    setIsTyping(true);
  };

  const handleSceneSelect = (idx: number) => {
    setActiveStep(idx);
    setIsTyping(true);
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
          
          {/* Left Column: Headlines with Typewriter */}
          <div className="story-text-column">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ minHeight: '150px' }}
              >
                <h2 style={{ 
                  fontSize: '3rem', 
                  fontWeight: 600, 
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                  margin: 0,
                }}>
                  {displayText}
                  {!isComplete && (
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      style={{ 
                        display: 'inline-block',
                        width: '3px',
                        height: '0.9em',
                        background: 'var(--primary)',
                        marginLeft: '2px',
                        verticalAlign: 'text-bottom'
                      }}
                    />
                  )}
                </h2>
                
                {/* Scene number indicator */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  style={{ 
                    marginTop: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    color: 'var(--primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }}>
                    Step {activeStep + 1} of {SCENES.length}
                  </span>
                  <div style={{ 
                    height: '2px', 
                    width: '40px', 
                    background: 'var(--primary)',
                    borderRadius: '1px'
                  }} />
                </motion.div>
              </motion.div>
            </AnimatePresence>
            
            {/* Progress Indicators and Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '3rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
              <div style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '300px' }}>
                {SCENES.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSceneSelect(idx)}
                    style={{
                      height: '4px',
                      flex: 1,
                      background: idx === activeStep ? 'var(--primary)' : 'var(--border-color)',
                      borderRadius: '2px',
                      transition: 'all 0.3s ease',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    aria-label={`Go to scene ${idx + 1}`}
                  >
                    {idx === activeStep && (
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 3, ease: 'linear' }}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          height: '100%',
                          background: 'var(--primary)',
                          opacity: 0.5
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Navigation Controls */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <motion.button 
                  onClick={handlePrev}
                  disabled={activeStep === 0}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
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
                </motion.button>
                <motion.button 
                  onClick={handleNext}
                  disabled={activeStep === SCENES.length - 1}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
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
                </motion.button>
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
                  initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 1.1, rotateY: 10 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                >
                  {React.createElement(SCENES[activeStep].component)}
                </motion.div>
              </AnimatePresence>
              
              {/* Scene label overlay */}
              <motion.div
                key={`label-${activeStep}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                style={{
                  position: 'absolute',
                  bottom: '1.5rem',
                  left: '1.5rem',
                  background: 'var(--bg-main)',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {SCENES[activeStep].id}
              </motion.div>
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
            font-size: 2rem !important;
            min-height: 80px;
          }
          .story-visual-column {
            width: 100%;
          }
        }

        @media (max-width: 640px) {
          .story-text-column h2 {
            font-size: 1.5rem !important;
            min-height: 60px;
          }
          .story-visual-column {
            aspect-ratio: 16/9;
            max-height: 300px;
          }
        }
      `}</style>
    </div>
  );
};
