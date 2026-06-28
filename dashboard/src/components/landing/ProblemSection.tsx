import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const OLD_WAY_WORDS = ['Subjective.', 'Slow.', 'Opaque.', 'Unaccountable.', 'Irreversible.'];

export const ProblemSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 75%',
        toggleActions: 'play none none none',
      },
    });

    // Left panel: words stagger in from left, each with strike-through drawing
    tl.from(wordRefs.current.filter(Boolean), {
      x: -60,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power3.out',
    }, 0);

    // Right panel: horizontal wipe reveal
    tl.from(rightRef.current, {
      clipPath: 'inset(0 100% 0 0)',
      duration: 1,
      ease: 'power3.inOut',
    }, 0.3);

    // $400 trillion: scale pulse on reveal
    const bigNum = sectionRef.current?.querySelector('.problem-big-num');
    if (bigNum) {
      tl.from(bigNum, {
        scale: 0.85,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
      }, 0.6);
    }
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="problem-section">
      <div className="problem-grid">
        {/* Left: the old way (visual metaphor built from text) */}
        <div ref={leftRef} className="problem-left">
          <div className="problem-old-words">
            {OLD_WAY_WORDS.map((word, i) => (
              <span
                key={word}
                ref={(el) => { wordRefs.current[i] = el; }}
                className="problem-old-word"
              >
                {word}
              </span>
            ))}
          </div>
        </div>

        {/* Right: headline, body, CTA */}
        <div ref={rightRef} className="problem-right">
          <span className="section-label">01 - THE PROBLEM</span>

          <h2 className="problem-headline">
            Real-world assets are a{' '}
            <span className="problem-big-num">$400 trillion</span>{' '}
            market. Valuation is still broken.
          </h2>

          <p className="problem-body">
            A single appraiser. A subjective opinion. Weeks of turnaround.
            No audit trail. No recourse. The largest asset class on earth
            runs on trust - and trust does not scale.
          </p>

          <p className="problem-body-secondary">
            Verdicto replaces single-point appraisals with a multi-agent AI
            system that independently analyzes assets, deliberates through a
            structured jury, and records every decision on-chain. Every step
            is captured in an HMAC-signed receipt chain: tamper-evident,
            cryptographically linked, and independently verifiable.
          </p>

          <Link to="/assess" className="problem-cta">
            Start a Valuation
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="cta-arrow">
              <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};
