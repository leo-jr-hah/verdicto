import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const CONTRACTS = [
  {
    name: 'VotingContract',
    hash: '0x7f8a9b2c...c3d4',
    block: '4,892,103',
    status: 'LIVE',
    metrics: [
      { label: 'totalVotes', value: '127' },
      { label: 'activeDisputes', value: '3' },
      { label: 'lastSettlement', value: '2026-06-28 14:32:07 UTC' },
    ],
  },
  {
    name: 'EscrowContract',
    hash: '0x3a2be8f1...e4d5',
    block: '4,891,998',
    status: 'LIVE',
    metrics: [
      { label: 'totalLocked', value: '847.5 CSPR' },
      { label: 'activeEscrows', value: '12' },
      { label: 'avgResolutionTime', value: '4.2h' },
    ],
  },
  {
    name: 'ReputationRegistry',
    hash: '0x9c4da2b7...f6a2',
    block: '4,891,856',
    status: 'LIVE',
    metrics: [
      { label: 'registeredAgents', value: '5' },
      { label: 'avgTrustScore', value: '847/1000' },
      { label: 'lastUpdate', value: '2026-06-28 14:30:15 UTC' },
    ],
  },
];

export const ContractProofSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const contractRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    // Each contract block: scale-in with subtle depth
    contractRefs.current.filter(Boolean).forEach((contract, i) => {
      gsap.from(contract, {
        scale: 0.97,
        opacity: 0,
        y: 30,
        duration: 0.6,
        delay: i * 0.12,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: contract,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      });
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="contract-section">
      <div className="contract-container">
        <span className="contract-label">04 / CONTRACTS</span>

        <div className="contract-list">
          {CONTRACTS.map((contract, i) => (
            <div
              key={contract.name}
              ref={(el) => { contractRefs.current[i] = el; }}
              className="contract-block"
            >
              <div className="contract-header">
                <span className="contract-name">{contract.name}</span>
                <span className="contract-hash">{contract.hash}</span>
                <span className="contract-block-num">#{contract.block}</span>
                <span className="contract-status">{contract.status}</span>
              </div>
              <div className="contract-metrics">
                {contract.metrics.map((m) => (
                  <div key={m.label} className="contract-metric">
                    <span className="contract-metric__tree">├─</span>
                    <span className="contract-metric__label">{m.label}:</span>
                    <span className="contract-metric__value">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <a
          href="https://testnet.cspr.live"
          target="_blank"
          rel="noopener noreferrer"
          className="contract-link"
        >
          View on Casper Testnet Explorer
          <ArrowUpRight size={16} strokeWidth={1.5} />
        </a>
      </div>
    </section>
  );
};
