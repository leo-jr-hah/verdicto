import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TechPipeline } from './TechPipeline';

gsap.registerPlugin(ScrollTrigger);

const PILLARS = [
  {
    num: '01',
    title: 'Multi-Agent Deliberation',
    body: 'Independent AI agents - each with a distinct analytical philosophy - analyze the same asset in parallel. A three-juror panel deliberates and votes. No single agent controls the outcome.',
    highlight: null,
  },
  {
    num: '02',
    title: 'On-Chain Audit Trail',
    body: 'Every deliberation step produces an HMAC-SHA256 signed receipt. Each receipt references the previous, forming a tamper-evident linked list. The chain is verified end-to-end using timing-safe comparison.',
    highlight: 'timing-safe comparison',
  },
  {
    num: '03',
    title: 'x402 Micropayments',
    body: 'Every API call is gated by on-chain payment verification. Users pay per action in CSPR - no accounts, no subscriptions, no API keys. Deploy hashes are verified against CSPR.cloud before execution.',
    highlight: null,
  },
  {
    num: '04',
    title: 'Smart Contracts',
    body: 'Three deployed Odra contracts on Casper: VotingContract (jury voting), ReputationRegistry (agent trust tiers), VerdictOracle (verdict storage and dispute resolution). Rust/WASM. Live on testnet.',
    highlight: 'Rust/WASM',
  },
];

const DETAILS = [
  { label: 'LLM Pipeline', value: 'MiMo V2 -> Groq Llama 3.3 70B -> deterministic heuristic. Every fallback flagged in UI.' },
  { label: 'Data Sources', value: 'RentCast, Met Museum API, CoinGecko, FRED / Federal Reserve' },
  { label: 'Trust Framework', value: 'Five-dimension scoring. Bronze -> Silver -> Gold -> Platinum tiers.' },
  { label: 'Persistence', value: 'Supabase PostgreSQL (production). Dual-write local JSON (dev). Schema-versioned.' },
];

export const TechnologySection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const pillarRefs = useRef<(HTMLDivElement | null)[]>([]);
  const detailsRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Pillars: each enters from alternating directions
    pillarRefs.current.filter(Boolean).forEach((pillar, i) => {
      if (!pillar) return;
      gsap.from(pillar, {
        x: i % 2 === 0 ? -40 : 40,
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: pillar,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    });

    // Details block: fade in as a unit
    gsap.from(detailsRef.current, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: detailsRef.current,
        start: 'top 88%',
        toggleActions: 'play none none none',
      },
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="technology-section">
      <div className="technology-container">
        <span className="section-label">03 - THE TECHNOLOGY</span>

        <h2 className="technology-headline">
          Built for verifiability, not just functionality.
        </h2>

        <p className="technology-subhead">
          Every agent execution is receipted. Every payment is on-chain.
          Every verdict is disputeable.
        </p>

        <div className="technology-pipeline-wrap">
          <TechPipeline />
        </div>

        <div className="technology-pillars">
          {PILLARS.map((pillar, i) => (
            <div
              key={pillar.num}
              ref={(el) => { pillarRefs.current[i] = el; }}
              className="technology-pillar"
            >
              <span className="technology-pillar-num">{pillar.num}</span>
              <h3 className="technology-pillar-title">{pillar.title}</h3>
              <p className="technology-pillar-body">
                {pillar.highlight ? (
                  <>
                    {pillar.body.split(pillar.highlight)[0]}
                    <span className="technology-highlight">{pillar.highlight}</span>
                    {pillar.body.split(pillar.highlight)[1]}
                  </>
                ) : pillar.body}
              </p>
            </div>
          ))}
        </div>

        <div ref={detailsRef} className="technology-details">
          <span className="technology-details-label">System Details</span>
          <div className="technology-details-grid">
            {DETAILS.map((d) => (
              <div key={d.label} className="technology-detail-item">
                <span className="technology-detail-label">{d.label}</span>
                <span className="technology-detail-value">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
