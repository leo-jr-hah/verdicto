import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LiveStateIcon } from './GeometricIcons';

gsap.registerPlugin(ScrollTrigger);

const LOG_LINES = [
  { type: 'cmd', text: 'agent.valuation_a.start("0x742d...", "real_estate")' },
  { type: 'ok', text: 'RentCast API connected' },
  { type: 'ok', text: '12 comparables fetched' },
  { type: 'data', text: '$2,847,000 ± 4.2%' },
  { type: 'blank', text: '' },
  { type: 'cmd', text: 'agent.valuation_b.start("0x742d...", "real_estate")' },
  { type: 'ok', text: 'FRED API connected' },
  { type: 'ok', text: 'DCF model: 7.5% discount rate' },
  { type: 'data', text: '$2,910,000 ± 5.8%' },
  { type: 'blank', text: '' },
  { type: 'cmd', text: 'juror.deliberate([valuation_a, valuation_b])' },
  { type: 'ok', text: 'Round 1: 3/3 jurors agree on valuation_a' },
  { type: 'ok', text: 'HMAC receipt: 0x9f2a...e4c1' },
  { type: 'ok', text: 'Consensus reached' },
  { type: 'blank', text: '' },
  { type: 'cmd', text: 'zk.commit(verdict, block_height=4892103)' },
  { type: 'ok', text: 'SHA-256: 7a3f...b2e8' },
  { type: 'ok', text: 'Deploy hash: 0x30da...8942' },
  { type: 'success', text: 'VERDICT CONFIRMED ON-CHAIN' },
];

export const LiveStateSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cursorRef = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    // Check if mobile (reduce effects/pins on mobile)
    const isMobile = window.innerWidth < 768;

    if (!isMobile) {
      // Pin the section and scrub through log lines
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: `+=${LOG_LINES.length * 80}%`,
          pin: true,
          scrub: 0.5,
        },
      });

      // Each line reveals sequentially tied to scroll
      lineRefs.current.filter(Boolean).forEach((line, i) => {
        tl.fromTo(line,
          { opacity: 0, x: -10 },
          { opacity: 1, x: 0, duration: 0.08, ease: 'none' },
          i * 0.05
        );
      });
    } else {
      // Progressive reveal without pin for mobile
      lineRefs.current.filter(Boolean).forEach((line) => {
        gsap.fromTo(line,
          { opacity: 0, x: -10 },
          { 
            opacity: 1, 
            x: 0, 
            duration: 0.4, 
            ease: 'power2.out',
            scrollTrigger: {
              trigger: line,
              start: 'top 95%',
              toggleActions: 'play none none none',
            }
          }
        );
      });
    }

    // Cursor blink animation (independent of scroll)
    gsap.to(cursorRef.current, {
      opacity: 0,
      duration: 0.5,
      repeat: -1,
      yoyo: true,
      ease: 'steps(1)',
    });
  }, { scope: sectionRef });

  const getLineClass = (type: string) => {
    switch (type) {
      case 'cmd': return 'terminal-line--cmd';
      case 'ok': return 'terminal-line--ok';
      case 'data': return 'terminal-line--data';
      case 'success': return 'terminal-line--success';
      default: return '';
    }
  };

  const getLinePrefix = (type: string) => {
    switch (type) {
      case 'cmd': return '>';
      case 'ok': return '[OK]';
      case 'data': return '  →';
      case 'success': return '  ✓';
      default: return '';
    }
  };

  return (
    <section ref={sectionRef} className="livestate-section">
      <div className="livestate-container">
        <div className="livestate-header">
          <span className="livestate-label">03 / LIVE STATE</span>
          <div className="livestate-badge">
            <LiveStateIcon className="geometric-icon geometric-icon--active" />
            <span className="livestate-badge__text">LIVE</span>
          </div>
        </div>

        <div ref={terminalRef} className="terminal">
          <div className="terminal__header">
            <span className="terminal__title">verdicto-cli v2.1.0</span>
            <span className="terminal__status">
              <span className="terminal__dot" />
              connected
            </span>
          </div>

          <div className="terminal__body">
            {LOG_LINES.map((line, i) => (
              <div
                key={i}
                ref={(el) => { lineRefs.current[i] = el; }}
                className={`terminal-line ${getLineClass(line.type)}`}
              >
                {line.type !== 'blank' && (
                  <>
                    <span className="terminal-line__prefix">{getLinePrefix(line.type)}</span>
                    <span className="terminal-line__text">{line.text}</span>
                  </>
                )}
              </div>
            ))}
            <div className="terminal-line">
              <span ref={cursorRef} className="terminal-cursor">_</span>
            </div>
          </div>
        </div>

        <div className="livestate-footer">
          5 agents · 2 rounds · 1 commitment · 4.2s total latency
        </div>
      </div>
    </section>
  );
};
