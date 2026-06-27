import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TRANSACTIONS = [
  { hash: '0x7f8a9b2c', block: '4,892,103', status: 'CONFIRMED', amount: '2.5 CSPR' },
  { hash: '0x3a2be8f1', block: '4,891,998', status: 'CONFIRMED', amount: '2.5 CSPR' },
  { hash: '0x9c4da2b7', block: '4,891,856', status: 'CONFIRMED', amount: '2.5 CSPR' },
];

export const TrustSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 75%',
        end: 'top 25%',
        scrub: false,
        toggleActions: 'play none none none',
      },
    });

    // Number: scale-in from 0.8 with slight rotation
    tl.from(numRef.current, {
      scale: 0.8,
      rotation: -3,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
    }, 0);

    // Headline: staggered word reveal (clip from bottom)
    tl.from(headlineRef.current, {
      y: 60,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
    }, 0.15);

    // Panel: horizontal wipe from left
    tl.from(panelRef.current, {
      clipPath: 'inset(0 100% 0 0)',
      duration: 0.9,
      ease: 'power2.inOut',
    }, 0.3);

    // Rows: staggered fade-up with 0.08s delay (deliberately not 0.1s)
    tl.from(rowRefs.current.filter(Boolean), {
      y: 20,
      opacity: 0,
      duration: 0.4,
      stagger: 0.08,
      ease: 'power2.out',
    }, 0.6);
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="trust-section">
      <div className="trust-grid">
        {/* Left: headline */}
        <div className="trust-text">
          <span ref={numRef} className="trust-num">01</span>
          <h2 ref={headlineRef} className="trust-headline">Verifiable by Design</h2>
          <p className="trust-body">
            Every valuation is hashed, signed, and stored on the Casper blockchain.
            Independently verifiable by anyone.
          </p>
        </div>

        {/* Right: data panel */}
        <div ref={panelRef} className="trust-panel">
          {TRANSACTIONS.map((tx, i) => (
            <div
              key={tx.hash}
              ref={(el) => { rowRefs.current[i] = el; }}
              className="trust-row"
            >
              <span className="trust-hash">{tx.hash}...</span>
              <span className="trust-block">#{tx.block}</span>
              <span className="trust-badge">{tx.status}</span>
              <span className="trust-amount">{tx.amount}</span>
            </div>
          ))}
          <div className="trust-footer">
            3 contracts · 29 transactions · Live on Testnet
          </div>
        </div>
      </div>
    </section>
  );
};
