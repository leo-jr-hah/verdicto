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
    // Each audience block: text lines reveal with stagger
    blockRefs.current.filter(Boolean).forEach((block) => {
      if (!block) return;
      const title = block.querySelector('.audience-title');
      const body = block.querySelector('.audience-body');

      gsap.from([title, body], {
        y: 30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: block,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    });

    // Closing line: simple fade
    gsap.from(closingRef.current, {
      y: 20,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: closingRef.current,
        start: 'top 90%',
        toggleActions: 'play none none none',
      },
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="audience-section">
      <div className="audience-container">
        <span className="section-label-light">04 - WHO IT'S FOR</span>

        <h2 className="audience-headline">
          For teams that need valuation they can defend.
        </h2>

        <div className="audience-list">
          {AUDIENCES.map((audience, i) => (
            <div
              key={audience.title}
              ref={(el) => { blockRefs.current[i] = el; }}
              className="audience-block"
            >
              <h3 className="audience-title">{audience.title}</h3>
              <p className="audience-body">{audience.body}</p>
            </div>
          ))}
        </div>

        <p ref={closingRef} className="audience-closing">
          Verdicto is live on Casper Testnet.
        </p>
      </div>
    </section>
  );
};
