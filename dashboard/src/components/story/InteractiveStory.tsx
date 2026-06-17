import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Info } from 'lucide-react';

import bgProperty from '../../assets/story/bg_property.webp';
import bgVerdictHq from '../../assets/story/bg_verdict_hq.webp';
import charOwner from '../../assets/story/char_owner.webp';
import charInvestor from '../../assets/story/char_investor.webp';
import charObserver from '../../assets/story/char_observer.webp';
import charVerdictHero from '../../assets/story/char_verdict_hero.webp';
import propAgentBot from '../../assets/story/prop_agent_bot.webp';
import propCasperBlock from '../../assets/story/prop_casper_block.webp';

interface InteractiveStoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InteractiveStory: React.FC<InteractiveStoryProps> = ({ isOpen, onClose }) => {
  const [sceneIndex, setSceneIndex] = useState(0);

  // Reset to first scene when opened
  useEffect(() => {
    if (isOpen) {
      setSceneIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (sceneIndex < scenes.length - 1) setSceneIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (sceneIndex > 0) setSceneIndex(prev => prev - 1);
  };

  const scene = scenes[sceneIndex];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      {/* Dark overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
        onClick={onClose}
      />

      {/* Story Modal Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        style={{
          width: '100%',
          maxWidth: '1200px',
          aspectRatio: '16/9',
          background: 'var(--bg-main)',
          borderRadius: '24px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Background Image Layer */}
        <AnimatePresence mode="wait">
          <motion.img 
            key={scene.bg}
            src={scene.bg}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
          />
        </AnimatePresence>

        {/* Dimmer overlay for text readability if needed */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)', zIndex: 1 }} />

        {/* Character Layer */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 5, overflow: 'hidden' }}>
          {scene.elements.map((el, i) => (
            <motion.div
              key={el.id}
              initial={el.initial}
              animate={el.animate}
              transition={el.transition || { type: 'spring', damping: 20 }}
              style={{ position: 'absolute', ...el.style }}
            >
              <img src={el.src} style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }} alt="character" />
            </motion.div>
          ))}
        </div>

        {/* Speech Bubbles Layer */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
          <AnimatePresence>
            {scene.bubbles.map((bubble, i) => (
              <motion.div
                key={`${sceneIndex}-${i}`}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 15, delay: bubble.delay || 0.2 }}
                style={{
                  position: 'absolute',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  padding: '1.25rem 1.5rem',
                  borderRadius: '16px',
                  boxShadow: 'var(--shadow-lg)',
                  maxWidth: '350px',
                  pointerEvents: 'auto',
                  ...bubble.style
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {bubble.speaker}
                </div>
                <div style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {bubble.text}
                </div>
                {bubble.learnMore && (
                  <button style={{ 
                    marginTop: '1rem', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    background: 'var(--bg-surface)', 
                    border: '1px solid var(--border-color)', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '8px', 
                    fontSize: '0.8rem', 
                    cursor: 'pointer',
                    color: 'var(--text-secondary)'
                  }}>
                    <Info size={14} /> Learn more about {bubble.learnMore}
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Top Bar Controls */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', zIndex: 20 }}>
          <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', padding: '0.5rem 1rem', borderRadius: '999px', color: 'white', fontSize: '0.85rem', fontWeight: 600 }}>
            Scene {sceneIndex + 1} of {scenes.length}
          </div>
          <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Bottom Navigation */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20 }}>
          <button 
            onClick={handlePrev} 
            disabled={sceneIndex === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', background: sceneIndex === 0 ? 'transparent' : 'var(--bg-main)',
              border: '1px solid var(--border-color)', padding: '0.75rem 1.5rem', borderRadius: '12px',
              color: sceneIndex === 0 ? 'transparent' : 'var(--text-primary)', cursor: sceneIndex === 0 ? 'default' : 'pointer', fontWeight: 600
            }}
          >
            <ChevronLeft size={18} /> Previous
          </button>
          
          <button 
            onClick={sceneIndex === scenes.length - 1 ? onClose : handleNext}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary)',
              border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px',
              color: 'white', cursor: 'pointer', fontWeight: 600, boxShadow: 'var(--shadow-md)'
            }}
          >
            {sceneIndex === scenes.length - 1 ? 'Explore Dashboard' : 'Next Scene'} <ChevronRight size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- SCENE CONFIGURATION ---
const scenes = [
  // Scene 1: Disagreement
  {
    bg: bgProperty,
    elements: [
      { id: 'owner', src: charOwner, initial: { x: -200, opacity: 0 }, animate: { x: 0, opacity: 1 }, style: { bottom: '5%', left: '10%', height: '70%' } },
      { id: 'investor', src: charInvestor, initial: { x: 200, opacity: 0 }, animate: { x: 0, opacity: 1 }, style: { bottom: '5%', right: '10%', height: '70%' } }
    ],
    bubbles: [
      { speaker: 'Asset Owner', text: 'This commercial building is easily worth $2.5 Million!', style: { top: '15%', left: '20%' }, delay: 0.5 },
      { speaker: 'Investor', text: 'No way, the market data says it\'s only worth $1.8 Million. We are at a deadlock.', style: { top: '25%', right: '15%' }, delay: 1.5 }
    ]
  },
  // Scene 2: Confusion
  {
    bg: bgProperty,
    elements: [
      { id: 'observer', src: charObserver, initial: { y: 200, opacity: 0 }, animate: { y: 0, opacity: 1 }, style: { bottom: '0', left: '35%', height: '80%' } }
    ],
    bubbles: [
      { speaker: 'Observer', text: 'Oh no... a major financial dispute. This is going to take months in court and cost thousands in legal fees. How do we solve this fairly without a central authority?', style: { top: '15%', left: '35%' }, delay: 0.5 }
    ]
  },
  // Scene 3: Enter the Hero
  {
    bg: bgProperty,
    elements: [
      { id: 'observer', src: charObserver, initial: { y: 0, opacity: 1 }, animate: { x: -200, opacity: 1 }, style: { bottom: '0', left: '35%', height: '80%' } },
      { id: 'hero', src: charVerdictHero, initial: { y: -500, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { type: 'spring', bounce: 0.5 }, style: { bottom: '10%', right: '25%', height: '85%' } }
    ],
    bubbles: [
      { speaker: 'Verdict', text: 'Fear not! I am Verdict. I can resolve this dispute instantly, fairly, and permanently using AI and the blockchain!', style: { top: '20%', right: '10%' }, delay: 0.8 }
    ]
  },
  // Scene 4: ZK
  {
    bg: bgVerdictHq,
    elements: [
      { id: 'hero', src: charVerdictHero, initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, style: { bottom: '5%', left: '10%', height: '80%' } },
      { id: 'owner', src: charOwner, initial: { opacity: 0 }, animate: { opacity: 1 }, style: { bottom: '5%', right: '25%', height: '60%' } },
      { id: 'investor', src: charInvestor, initial: { opacity: 0 }, animate: { opacity: 1 }, style: { bottom: '5%', right: '5%', height: '60%' } }
    ],
    bubbles: [
      { speaker: 'Verdict', text: 'First, upload your data. Don\'t worry about privacy—we use Zero-Knowledge (ZK) technology. This lets you prove your financial numbers are real without actually showing me your private bank statements!', style: { top: '15%', left: '15%', maxWidth: '400px' }, delay: 0.5, learnMore: 'ZK Proofs' }
    ]
  },
  // Scene 5: X402
  {
    bg: bgVerdictHq,
    elements: [
      { id: 'hero', src: charVerdictHero, initial: { opacity: 1 }, animate: { opacity: 1 }, style: { bottom: '5%', left: '10%', height: '80%' } }
    ],
    bubbles: [
      { speaker: 'Verdict', text: 'To ensure nobody unauthorized sneaks into this dispute, we issue an X402 Token. Think of it as a VIP digital ticket. It ensures only verified parties have access to this specific case.', style: { top: '25%', left: '35%', maxWidth: '400px' }, delay: 0.2, learnMore: 'X402 Authentication' }
    ]
  },
  // Scene 6: HMAC
  {
    bg: bgVerdictHq,
    elements: [
      { id: 'hero', src: charVerdictHero, initial: { opacity: 1 }, animate: { opacity: 1 }, style: { bottom: '5%', left: '10%', height: '80%' } }
    ],
    bubbles: [
      { speaker: 'Verdict', text: 'When you send the data, we stamp it with an HMAC. Think of it as an unbreakable digital wax seal. If a hacker tries to tamper with the data while it\'s traveling, the seal breaks and we reject it!', style: { top: '25%', left: '35%', maxWidth: '400px' }, delay: 0.2, learnMore: 'HMAC Security' }
    ]
  },
  // Scene 7: Summoning Agents
  {
    bg: bgVerdictHq,
    elements: [
      { id: 'hero', src: charVerdictHero, initial: { opacity: 1 }, animate: { opacity: 1 }, style: { bottom: '5%', left: '10%', height: '80%' } },
      { id: 'bot1', src: propAgentBot, initial: { scale: 0 }, animate: { scale: 1 }, style: { bottom: '40%', right: '35%', height: '20%' }, transition: { delay: 0.5 } },
      { id: 'bot2', src: propAgentBot, initial: { scale: 0 }, animate: { scale: 1 }, style: { bottom: '60%', right: '20%', height: '20%' }, transition: { delay: 0.7 } },
      { id: 'bot3', src: propAgentBot, initial: { scale: 0 }, animate: { scale: 1 }, style: { bottom: '30%', right: '10%', height: '20%' }, transition: { delay: 0.9 } }
    ],
    bubbles: [
      { speaker: 'Verdict', text: 'Now that the data is perfectly secure, I don\'t use a human judge. Instead, I summon a decentralized swarm of independent AI Agents to review the facts.', style: { top: '10%', left: '15%', maxWidth: '400px' }, delay: 0.2 }
    ]
  },
  // Scene 8: Investigation
  {
    bg: bgVerdictHq,
    elements: [
      { id: 'observer', src: charObserver, initial: { opacity: 0, x: -50 }, animate: { opacity: 1, x: 0 }, style: { bottom: '5%', left: '5%', height: '60%' } },
      { id: 'hero', src: charVerdictHero, initial: { opacity: 1 }, animate: { opacity: 1 }, style: { bottom: '5%', left: '35%', height: '80%' } }
    ],
    bubbles: [
      { speaker: 'Observer', text: 'Wait, what if one of the AI agents makes a mistake or is biased?', style: { top: '15%', left: '5%' }, delay: 0.5 },
      { speaker: 'Verdict', text: 'Great question! That\'s why they don\'t work alone.', style: { top: '25%', left: '45%' }, delay: 1.5 }
    ]
  },
  // Scene 9: Consensus
  {
    bg: bgVerdictHq,
    elements: [
      { id: 'hero', src: charVerdictHero, initial: { opacity: 1 }, animate: { opacity: 1 }, style: { bottom: '5%', left: '5%', height: '80%' } },
      { id: 'bot1', src: propAgentBot, initial: { opacity: 1 }, animate: { opacity: 1 }, style: { top: '20%', right: '25%', height: '25%' } },
      { id: 'bot2', src: propAgentBot, initial: { opacity: 1 }, animate: { opacity: 1 }, style: { bottom: '20%', right: '35%', height: '25%' } },
      { id: 'bot3', src: propAgentBot, initial: { opacity: 1 }, animate: { opacity: 1 }, style: { bottom: '30%', right: '10%', height: '25%' } }
    ],
    bubbles: [
      { speaker: 'Verdict', text: 'The AI agents cross-check each other\'s work. Agents with a history of being highly accurate have their votes weighted heavier. We call this Trust-Weighted Consensus. It guarantees mathematical fairness.', style: { top: '10%', left: '25%', maxWidth: '400px' }, delay: 0.2 }
    ]
  },
  // Scene 10: Resolution
  {
    bg: bgVerdictHq,
    elements: [
      { id: 'hero', src: charVerdictHero, initial: { opacity: 1 }, animate: { opacity: 1 }, style: { bottom: '5%', left: '35%', height: '80%' } },
      { id: 'owner', src: charOwner, initial: { opacity: 1 }, animate: { opacity: 1 }, style: { bottom: '5%', left: '5%', height: '60%' } },
      { id: 'investor', src: charInvestor, initial: { opacity: 1 }, animate: { opacity: 1 }, style: { bottom: '5%', right: '5%', height: '60%' } }
    ],
    bubbles: [
      { speaker: 'Verdict', text: 'Through consensus, the agents have mathematically determined the exact fair market value is $2.1 Million.', style: { top: '5%', left: '35%', maxWidth: '400px' }, delay: 0.2 },
      { speaker: 'Owner & Investor', text: 'That makes total sense based on the verified data. We accept!', style: { top: '20%', left: '5%', maxWidth: '300px' }, delay: 2 }
    ]
  },
  // Scene 11: Casper Blockchain
  {
    bg: bgVerdictHq,
    elements: [
      { id: 'hero', src: charVerdictHero, initial: { opacity: 1 }, animate: { opacity: 1 }, style: { bottom: '5%', left: '10%', height: '80%' } },
      { id: 'casper', src: propCasperBlock, initial: { scale: 0, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: 'spring', bounce: 0.5 }, style: { bottom: '20%', right: '20%', height: '40%' } }
    ],
    bubbles: [
      { speaker: 'Verdict', text: 'Finally, I take this verdict and permanently lock it onto the Casper Blockchain. Once it\'s on Casper, it can never be tampered with, deleted, or altered by anyone. Total transparency!', style: { top: '15%', left: '20%', maxWidth: '400px' }, delay: 0.5, learnMore: 'Casper Finality' }
    ]
  },
  // Scene 12: Conclusion
  {
    bg: bgProperty,
    elements: [
      { id: 'observer', src: charObserver, initial: { opacity: 0 }, animate: { opacity: 1 }, style: { bottom: '5%', left: '5%', height: '70%' } },
      { id: 'hero', src: charVerdictHero, initial: { opacity: 0 }, animate: { opacity: 1 }, style: { bottom: '5%', right: '5%', height: '80%' } }
    ],
    bubbles: [
      { speaker: 'Observer', text: 'So you securely gathered data, hid the private parts, proved it wasn\'t tampered with, resolved it using an AI swarm, and locked it on the blockchain?', style: { top: '15%', left: '5%', maxWidth: '350px' }, delay: 0.5 },
      { speaker: 'Verdict', text: 'Exactly. Welcome to the future of Real World Asset management.', style: { top: '30%', right: '15%', maxWidth: '350px' }, delay: 2.5 }
    ]
  }
];
