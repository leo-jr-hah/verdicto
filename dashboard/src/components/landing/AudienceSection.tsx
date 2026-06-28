import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const AUDIENCES = [
  {
    title: 'Asset Managers & Fund Operators',
    body: 'Managing portfolios of real-world assets - real estate, art, commodities - requires independent, documented valuations for NAV reporting, investor disclosures, and regulatory compliance. Verdicto provides a multi-agent process with a full HMAC-chained audit trail. Every deliberation step is cryptographically signed and linked, not a single appraiser\'s opinion.',
  },
  {
    title: 'DeFi Protocols & Lending Platforms',
    body: 'RWA-collateralized lending is growing, but protocols need reliable, on-chain valuation oracles to set LTV ratios and trigger liquidations. Verdicto\'s assessment pipeline produces verifiable valuations with confidence scores and divergence metrics - backed by HMAC-receipted deliberation chains that protocols can independently verify.',
  },
  {
    title: 'Insurance Underwriters',
    body: 'Traditional asset insurance relies on periodic manual appraisals. Verdicto enables continuous, AI-driven risk assessment with automatic revaluation. If value has dropped, the system pays out - reducing the gap between policy issuance and the next formal appraisal.',
  },
  {
    title: 'Blockchain Infrastructure Partners',
    body: 'Casper-native. Verdicto demonstrates what\'s possible on Casper: smart contracts in Rust/WASM, HMAC-chained receipt audit trails, x402 micropayments, and a multi-agent system where every execution step is cryptographically receipted and anchored to block heights.',
  },
];

export const AudienceSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const closingRef = useRef<HTMLParagraphElement>(null);

  useGSAP(() => {
    blockRefs.current.filter(Boolean).forEach((block) => {
      if (!block) return;
      
      const tl = gsap.timeline({ paused: true });

      tl.from(block, {
        x: -40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });

      // Child elements stagger
      const children = block.querySelectorAll('h3, p');
      if (children.length) {
        tl.from(children, {
          y: 20,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
        }, '-=0.4');
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            tl.play();
            observer.disconnect();
          }
        },
        { threshold: 0.15 }
      );
      observer.observe(block);
    });

    // Closing line
    const tlClosing = gsap.timeline({ paused: true });
    tlClosing.from(closingRef.current, {
      y: 20,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
    });

    const closingObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          tlClosing.play();
          closingObserver.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (closingRef.current) closingObserver.observe(closingRef.current);
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} id="audience" className="lp-section">
      <div className="lp-section__inner">
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: 'var(--accent-dim)',
          textTransform: 'uppercase',
          display: 'block',
          marginBottom: '32px'
        }}>04 - WHO IT'S FOR</span>

        <h2 className="lp-headline">
          For protocols that demand absolute certainty.
        </h2>

        <div className="audience-grid">
          {AUDIENCES.map((audience, i) => (
            <div
              key={audience.title}
              ref={(el) => { blockRefs.current[i] = el; }}
              className="audience-card"
            >
              <h3 className="audience-card__name">{audience.title}</h3>
              <p className="audience-card__description">{audience.body}</p>
            </div>
          ))}
        </div>

        <p ref={closingRef} className="audience-closing__text">
          Verdicto is live on Casper Testnet.
        </p>
      </div>
    </section>
  );
};
