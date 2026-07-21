import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ReceiptChainIcon, DeliberationIcon, CommitmentIcon, VerdictIcon } from './GeometricIcons';

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    num: '01',
    title: 'Connect & Pay',
    icon: ReceiptChainIcon,
    description: 'Connect your Casper Wallet. Pay 2.5 CSPR via a native transfer, the wallet signs it, producing a cryptographic payment proof. No accounts, no API keys.',
    detail: 'x402 micropayment with wallet signature',
    width: '55%',
    indent: '0%',
  },
  {
    num: '02',
    title: 'Multi-Agent Analysis',
    icon: DeliberationIcon,
    description: 'Two independent AI analysts produce separate valuations using different methodologies. Each agent\'s input, state, and output are recorded for the on-chain hash commitment.',
    detail: '2 analysts with independent methodologies',
    width: '50%',
    indent: '10%',
  },
  {
    num: '03',
    title: 'Juror Deliberation',
    icon: CommitmentIcon,
    description: 'Three specialized jurors evaluate which analysis is more credible. Every deliberation round is signed with HMAC-SHA256, each receipt chains to the previous.',
    detail: 'HMAC receipt chains, tamper-proof audit trail',
    width: '60%',
    indent: '20%',
  },
  {
    num: '04',
    title: 'On-Chain Commitment',
    icon: VerdictIcon,
    description: 'A hash commitment (SHA-256 of execution state + Casper block height) is anchored on-chain. The verdict, receipts, and commitment are all independently verifiable.',
    detail: 'Hash commitment anchored to Casper L1',
    width: '52%',
    indent: '30%',
  },
];

export const ProcessSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    // Header: slide in from left
    gsap.from(headerRef.current, {
      x: -80,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });

    // Steps: each enters from a different direction
    stepRefs.current.filter(Boolean).forEach((step, i) => {
      const directions = [
        { x: -60, y: 30 },   // Step 01: from left-bottom
        { x: 60, y: 40 },    // Step 02: from right-bottom
        { x: -40, y: 50 },   // Step 03: from left-bottom (shallower)
        { x: 80, y: 20 },    // Step 04: from right (shallower)
      ];
      const dir = directions[i];

      gsap.from(step, {
        x: dir.x,
        y: dir.y,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: step,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="process-section">
      <div className="process-container">
        <div ref={headerRef} className="process-header">
          <span className="process-label">02 / PROCESS</span>
        </div>

        <div className="process-steps">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                ref={(el) => { stepRefs.current[i] = el; }}
                className="process-step"
                style={{ width: step.width, marginLeft: step.indent }}
              >
                <div className="process-step__header">
                  <span className="process-step__num">{step.num}</span>
                  <Icon className="geometric-icon" />
                  <h3 className="process-step__title">{step.title}</h3>
                </div>
                <p className="process-step__desc">{step.description}</p>
                <span className="process-step__detail">{step.detail}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
