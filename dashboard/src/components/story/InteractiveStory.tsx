import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, CheckCircle, AlertTriangle, ShieldCheck, Database, FileText, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

const learnMoreData: Record<string, { title: string, layman: string, tech: string }> = {
  'ZK Proofs': {
    title: 'Zero-Knowledge (ZK) Technology',
    layman: 'Imagine you want to prove to a bouncer that you are over 21, but you don\'t want them to see your name, address, or exact birth date on your ID. ZK technology works exactly like that for your financial data. You prove your claims are true without handing over your private documents.',
    tech: 'We utilize zk-SNARKs (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge) to generate a cryptographic proof of computation. This allows our system to verify the integrity and correctness of off-chain data without exposing the raw inputs on-chain.'
  },
  'X402 Authentication': {
    title: 'X402 Token Authentication',
    layman: 'Think of an X402 token like a VIP wristband at a concert. It not only proves who you are, but it strictly defines exactly which areas you are allowed to enter. It ensures only the authorized parties can view or interact with this specific dispute case.',
    tech: 'X402 (similar to L402 or Macaroons) is a bearer token standard that combines authentication with verifiable claims and payment proofs. It allows for highly granular, cryptographically verifiable access control to specific API endpoints and dispute states.'
  },
  'HMAC Security': {
    title: 'HMAC Data Integrity',
    layman: 'When you mail an important letter, you seal the envelope with wax. If someone opens it during delivery, the seal breaks and you know it was tampered with. HMAC does the exact same thing for your digital data as it travels across the internet.',
    tech: 'HMAC (Hash-based Message Authentication Code) combines a cryptographic hash function with a secret cryptographic key. It provides both data integrity and authenticity guarantees, ensuring that man-in-the-middle attacks cannot alter the payload without invalidating the hash.'
  },
  'Casper Finality': {
    title: 'Casper Blockchain Finality',
    layman: 'Once a decision is made, we write it in stone. Casper is a highly secure digital ledger. Once the verdict is locked onto Casper, no hacker, government, or even the original creators can ever delete or alter it. It is permanent and transparent.',
    tech: 'We deploy the verdict payload to the Casper Network, a Proof-of-Stake (PoS) blockchain utilizing the Highway protocol (based on CBC Casper). This provides mathematically provable block finality, preventing network forks and ensuring deterministic immutability of the RWA state.'
  }
};

export const InteractiveStory: React.FC<InteractiveStoryProps> = ({ isOpen, onClose }) => {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  
  const navigate = useNavigate();

  // Reset to first scene when opened
  useEffect(() => {
    if (isOpen) {
      setSceneIndex(0);
      setActiveTopic(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (sceneIndex < scenes.length - 1) {
      setSceneIndex(prev => prev + 1);
      setActiveTopic(null);
    }
  };

  const handlePrev = () => {
    if (sceneIndex > 0) {
      setSceneIndex(prev => prev - 1);
      setActiveTopic(null);
    }
  };

  const handleExplore = () => {
    onClose();
    navigate('/dashboard');
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
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
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
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)', zIndex: 1 }} />

        {/* Character Layer */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 5, overflow: 'hidden' }}>
          {scene.elements.map((el) => (
            <motion.div
              key={el.id}
              initial={el.initial}
              animate={el.animate}
              transition={('transition' in el ? el.transition : undefined) || ({ type: 'spring', damping: 20 } as any)}
              style={{ position: 'absolute', ...el.style }}
            >
              <img src={el.src} style={{ width: 'auto', height: '100%', display: 'block', objectFit: 'contain' }} alt="character" />
            </motion.div>
          ))}

          {/* Special Visual FX Layer (e.g., Casper block absorbing verdict) */}
          {sceneIndex === 10 && (
             <motion.div
               initial={{ opacity: 0, scale: 0, y: -100 }}
               animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.2], y: [-100, 0, 50], x: [0, 0, 100] }}
               transition={{ duration: 2, delay: 1, ease: 'easeInOut' }}
               style={{ position: 'absolute', top: '30%', left: '45%', width: '60px', height: '60px', background: 'gold', borderRadius: '50%', boxShadow: '0 0 20px gold', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6 }}
             >
               <FileText color="black" size={24} />
             </motion.div>
          )}
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
                  maxWidth: '380px',
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
                {('learnMore' in bubble && bubble.learnMore) && (
                  <button 
                    onClick={() => setActiveTopic((bubble as any).learnMore as string)}
                    style={{ 
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
                    <Info size={14} /> Learn more about {(bubble as any).learnMore}
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Top Bar Controls */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '1.5rem 2rem', display: 'flex', justifyContent: 'flex-end', zIndex: 20 }}>
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
            onClick={sceneIndex === scenes.length - 1 ? handleExplore : handleNext}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary)',
              border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px',
              color: 'white', cursor: 'pointer', fontWeight: 600, boxShadow: 'var(--shadow-md)'
            }}
          >
            {sceneIndex === scenes.length - 1 ? 'Explore Dashboard' : 'Next Scene'} <ChevronRight size={18} />
          </button>
        </div>

        {/* Learn More Overlay */}
        <AnimatePresence>
          {activeTopic && learnMoreData[activeTopic] && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              style={{
                position: 'absolute',
                inset: '10%',
                background: 'var(--bg-main)',
                borderRadius: '24px',
                zIndex: 50,
                padding: '3rem',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                overflowY: 'auto'
              }}
            >
              <button 
                onClick={() => setActiveTopic(null)}
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}
              >
                <X size={20} />
              </button>
              
              <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {learnMoreData[activeTopic].title}
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: '16px' }}>
                  <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>{learnMoreData[activeTopic].layman}</p>
                </div>
                
                <div style={{ background: '#0a0a0a', padding: '2rem', borderRadius: '16px', border: '1px solid #333' }}>
                  <div style={{ color: '#10B981', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Under The Hood</div>
                  <p style={{ fontSize: '1rem', lineHeight: 1.6, color: '#e5e5e5', fontFamily: 'monospace' }}>{learnMoreData[activeTopic].tech}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
      { id: 'owner', src: charOwner, initial: { x: -200, opacity: 0 }, animate: { x: 0, opacity: 1 }, style: { bottom: '0', left: '10%', height: '70%' } },
      { id: 'investor', src: charInvestor, initial: { x: 200, opacity: 0 }, animate: { x: 0, opacity: 1 }, style: { bottom: '0', right: '10%', height: '70%' } }
    ],
    bubbles: [
      { speaker: 'Asset Owner', text: 'This commercial building is easily worth $2.5 Million!', style: { top: '15%', left: '25%' }, delay: 0.5 },
      { speaker: 'Investor', text: 'No way, the market data says it\'s only worth $1.8 Million. We are at a deadlock.', style: { top: '35%', right: '25%' }, delay: 1.5 }
    ]
  },
  // Scene 2: Confusion
  {
    bg: bgProperty,
    elements: [
      { id: 'observer', src: charObserver, initial: { y: 200, opacity: 0 }, animate: { y: 0, opacity: 1 }, style: { bottom: '0', left: '35%', height: '75%' } }
    ],
    bubbles: [
      { speaker: 'Observer', text: 'Oh no... a major financial dispute. This is going to take months in court and cost thousands in legal fees. How do we solve this fairly without a central authority?', style: { top: '20%', left: '10%', maxWidth: '350px' }, delay: 0.5 }
    ]
  },
  // Scene 3: Enter the Hero
  {
    bg: bgProperty,
    elements: [
      { id: 'observer', src: charObserver, initial: { opacity: 1 }, animate: { opacity: 1 }, style: { bottom: '0', left: '10%', height: '70%' } },
      { id: 'hero', src: charVerdictHero, initial: { y: -500, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { type: 'spring', bounce: 0.5 }, style: { bottom: '0', right: '15%', height: '80%' } }
    ],
    bubbles: [
      { speaker: 'Verdict', text: 'Fear not! I am Verdict. I can resolve this dispute instantly, fairly, and permanently using AI and the blockchain!', style: { top: '15%', left: '35%' }, delay: 0.8 }
    ]
  },
  // Scene 4: ZK
  {
    bg: bgVerdictHq,
    elements: [
      { id: 'hero', src: charVerdictHero, initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, style: { bottom: '0', left: '5%', height: '80%' } },
      { id: 'owner', src: charOwner, initial: { opacity: 0 }, animate: { opacity: 1 }, style: { bottom: '0', right: '30%', height: '65%' } },
      { id: 'investor', src: charInvestor, initial: { opacity: 0 }, animate: { opacity: 1 }, style: { bottom: '0', right: '10%', height: '65%' } }
    ],
    bubbles: [
      { speaker: 'Verdict', text: 'First, upload your data. Don\'t worry about privacy - we use Zero-Knowledge (ZK) technology. This lets you prove your financial numbers are real without actually showing me your private bank statements!', style: { top: '5%', left: '50%', transform: 'translateX(-50%)', maxWidth: '400px' }, delay: 0.5, learnMore: 'ZK Proofs' }
    ]
  },
  // Scene 5: X402
  {
    bg: bgVerdictHq,
    elements: [
      { id: 'hero', src: charVerdictHero, initial: { opacity: 1 }, animate: { opacity: 1 }, style: { bottom: '0', left: '5%', height: '80%' } }
    ],
    bubbles: [
      { speaker: 'Verdict', text: 'To ensure nobody unauthorized sneaks into this dispute, we issue an X402 Token. Think of it as a VIP digital ticket. It ensures only verified parties have access to this specific case.', style: { top: '20%', left: '40%', maxWidth: '400px' }, delay: 0.2, learnMore: 'X402 Authentication' }
    ]
  },
  // Scene 6: HMAC
  {
    bg: bgVerdictHq,
    elements: [
      { id: 'hero', src: charVerdictHero, initial: { opacity: 1 }, animate: { opacity: 1 }, style: { bottom: '0', left: '5%', height: '80%' } }
    ],
    bubbles: [
      { speaker: 'Verdict', text: 'When you send the data, we stamp it with an HMAC. Think of it as an unbreakable digital wax seal. If a hacker tries to tamper with the data while it\'s traveling, the seal breaks and we reject it!', style: { top: '20%', left: '40%', maxWidth: '400px' }, delay: 0.2, learnMore: 'HMAC Security' }
    ]
  },
  // Scene 7: Summoning Agents
  {
    bg: bgVerdictHq,
    elements: [
      { id: 'hero', src: charVerdictHero, initial: { opacity: 1 }, animate: { opacity: 1 }, style: { bottom: '0', left: '5%', height: '80%' } },
      { id: 'bot1', src: propAgentBot, initial: { scale: 0 }, animate: { scale: 1, x: [0, 40, -20, 0], y: [0, -25, 20, 0] }, style: { bottom: '40%', right: '40%', height: '12%' }, transition: { delay: 0.5, x: { repeat: Infinity, duration: 4 }, y: { repeat: Infinity, duration: 3 } } },
      { id: 'bot2', src: propAgentBot, initial: { scale: 0 }, animate: { scale: 1, x: [0, -30, 20, 0], y: [0, 25, -15, 0] }, style: { bottom: '50%', right: '25%', height: '12%' }, transition: { delay: 0.7, x: { repeat: Infinity, duration: 4.5 }, y: { repeat: Infinity, duration: 3.5 } } },
      { id: 'bot3', src: propAgentBot, initial: { scale: 0 }, animate: { scale: 1, x: [0, 25, -25, 0], y: [0, 15, -20, 0] }, style: { bottom: '40%', right: '15%', height: '12%' }, transition: { delay: 0.9, x: { repeat: Infinity, duration: 3.8 }, y: { repeat: Infinity, duration: 4 } } },
      { id: 'bot4', src: propAgentBot, initial: { scale: 0 }, animate: { scale: 1, x: [0, -40, 30, 0], y: [0, -20, 25, 0] }, style: { bottom: '30%', right: '10%', height: '12%' }, transition: { delay: 1.1, x: { repeat: Infinity, duration: 5 }, y: { repeat: Infinity, duration: 4.2 } } },
      { id: 'bot5', src: propAgentBot, initial: { scale: 0 }, animate: { scale: 1, x: [0, 30, -30, 0], y: [0, 30, -10, 0] }, style: { bottom: '60%', right: '35%', height: '12%' }, transition: { delay: 1.3, x: { repeat: Infinity, duration: 4.2 }, y: { repeat: Infinity, duration: 4.8 } } }
    ],
    bubbles: [
      { speaker: 'Verdict', text: 'Now that the data is perfectly secure, I don\'t use a human judge. Instead, I summon a decentralized swarm of independent AI Agents to review the facts.', style: { top: '10%', left: '35%', maxWidth: '400px' }, delay: 0.2 }
    ]
  },
  // Scene 8: Investigation
  {
    bg: bgVerdictHq,
    elements: [
      { id: 'observer', src: charObserver, initial: { opacity: 0, x: -50 }, animate: { opacity: 1, x: 0 }, style: { bottom: '0', left: '5%', height: '70%' } },
      { id: 'hero', src: charVerdictHero, initial: { opacity: 1 }, animate: { opacity: 1 }, style: { bottom: '0', right: '10%', height: '80%' } }
    ],
    bubbles: [
      { speaker: 'Observer', text: 'Wait, what if one of the AI agents makes a mistake or is biased?', style: { top: '15%', left: '30%' }, delay: 0.5 },
      { speaker: 'Verdict', text: 'Great question! That\'s why they don\'t work alone.', style: { top: '35%', right: '35%' }, delay: 1.5 }
    ]
  },
  // Scene 9: Consensus
  {
    bg: bgVerdictHq,
    elements: [
      { id: 'hero', src: charVerdictHero, initial: { opacity: 1 }, animate: { opacity: 1 }, style: { bottom: '0', left: '5%', height: '80%' } },
      { id: 'bot1', src: propAgentBot, initial: { opacity: 1 }, animate: { y: [0, -10, 10, 0] }, style: { bottom: '30%', right: '30%', height: '12%' }, transition: { repeat: Infinity, duration: 3 } },
      { id: 'bot2', src: propAgentBot, initial: { opacity: 1 }, animate: { y: [0, -10, 10, 0] }, style: { bottom: '40%', right: '40%', height: '12%' }, transition: { repeat: Infinity, duration: 3.5, delay: 0.5 } },
      { id: 'bot3', src: propAgentBot, initial: { opacity: 1 }, animate: { y: [0, -10, 10, 0] }, style: { bottom: '35%', right: '15%', height: '12%' }, transition: { repeat: Infinity, duration: 4, delay: 1 } }
    ],
    bubbles: [
      { speaker: 'Verdict', text: 'The AI agents cross-check each other\'s work. Agents with a history of being highly accurate have their votes weighted heavier. We call this Trust-Weighted Consensus. It guarantees mathematical fairness.', style: { top: '15%', left: '30%', maxWidth: '400px' }, delay: 0.2 }
    ]
  },
  // Scene 10: Resolution
  {
    bg: bgVerdictHq,
    elements: [
      { id: 'hero', src: charVerdictHero, initial: { opacity: 1 }, animate: { opacity: 1 }, style: { bottom: '0', left: '50%', transform: 'translateX(-50%)', height: '80%' } },
      { id: 'owner', src: charOwner, initial: { opacity: 1 }, animate: { opacity: 1 }, style: { bottom: '0', left: '0%', height: '60%' } },
      { id: 'investor', src: charInvestor, initial: { opacity: 1 }, animate: { opacity: 1 }, style: { bottom: '0', right: '0%', height: '60%' } }
    ],
    bubbles: [
      { speaker: 'Verdict', text: 'Through consensus, the agents have mathematically determined the exact fair market value is $2.1 Million, not $2.5 Million or $1.8 Million.', style: { top: '5%', left: '22%', maxWidth: '340px' }, delay: 0.2 },
      { speaker: 'Asset Owner', text: 'That makes total sense based on the verified data. I accept!', style: { top: '30%', left: '15%', maxWidth: '240px' }, delay: 2 },
      { speaker: 'Investor', text: 'Thank you for this awesome work, Verdict! This saved us months of legal battles.', style: { top: '5%', right: '5%', maxWidth: '250px' }, delay: 3 }
    ]
  },
  // Scene 11: Casper Blockchain
  {
    bg: bgVerdictHq,
    elements: [
      { id: 'hero', src: charVerdictHero, initial: { opacity: 1 }, animate: { opacity: 1 }, style: { bottom: '0', left: '5%', height: '80%' } },
      { id: 'casper_glow', src: propCasperBlock, initial: { scale: 1.2, opacity: 0 }, animate: { scale: [1, 1.5, 1], opacity: [0, 0.4, 0] }, transition: { repeat: Infinity, duration: 2 }, style: { bottom: '28%', right: '18%', height: '22%', filter: 'blur(10px)', zIndex: 0 } },
      { id: 'casper', src: propCasperBlock, initial: { scale: 0, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: 'spring', bounce: 0.5 }, style: { bottom: '30%', right: '20%', height: '18%', zIndex: 1 } }
    ],
    bubbles: [
      { speaker: 'Verdict', text: 'Finally, I take this verdict and permanently lock it onto the Casper Blockchain. Once it\'s on Casper, it can never be tampered with, deleted, or altered by anyone. Total transparency!', style: { top: '15%', left: '35%', maxWidth: '400px' }, delay: 0.5, learnMore: 'Casper Finality' }
    ]
  },
  // Scene 12: Conclusion
  {
    bg: bgProperty,
    elements: [
      { id: 'observer', src: charObserver, initial: { opacity: 0 }, animate: { opacity: 1 }, style: { bottom: '0', left: '10%', height: '70%' } },
      { id: 'hero', src: charVerdictHero, initial: { opacity: 0 }, animate: { opacity: 1 }, style: { bottom: '0', right: '10%', height: '80%' } }
    ],
    bubbles: [
      { speaker: 'Observer', text: 'So you securely gathered data, hid the private parts, proved it wasn\'t tampered with, resolved it using an AI swarm, and locked it on the blockchain?', style: { top: '5%', left: '5%', maxWidth: '350px' }, delay: 0.5 },
      { speaker: 'Verdict', text: 'Exactly. Welcome to the future of Real World Asset management.', style: { top: '5%', right: '5%', maxWidth: '350px' }, delay: 2.5 }
    ]
  }
];
