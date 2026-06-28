import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Shield, Link2, Fingerprint, BarChart3, Swords } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const LAYERS = [
  {
    icon: Link2,
    title: 'HMAC Receipt Chains',
    subtitle: 'Tamper-proof audit trail',
    code: [
      'receipt[0] = HMAC-SHA256(input, state, timestamp)',
      'receipt[n] = HMAC-SHA256(data ‖ receipt[n-1])',
      'break any link → chain invalidates',
    ],
    description:
      'Every step the AI agents take — fetching data, running analysis, casting votes — is hashed and signed. Each receipt chains to the previous one. Modify any single receipt and every subsequent hash breaks.',
  },
  {
    icon: Fingerprint,
    title: 'ZK-Lite Commitments',
    subtitle: 'On-chain execution proof',
    code: [
      'commitment = SHA-256(',
      '  inputHash ‖ agentStateHash ‖ timestamp ‖ blockHeight',
      ')',
    ],
    description:
      'A lightweight cryptographic commitment binds the full execution state to a specific Casper block height. Anyone can recompute the hash off-chain and compare it to what\'s anchored on L1 — without needing full ZK-SNARKs.',
  },
  {
    icon: BarChart3,
    title: 'Trust Scoring',
    subtitle: '5-dimension agent reputation',
    code: [
      'score = (execution × 0.4)',
      '      + (consistency × 0.3)',
      '      + (economic_stake × 0.3)',
      'tier: platinum | gold | silver | bronze',
    ],
    description:
      'Each agent is scored on identity verification, execution accuracy, output consistency, and CSPR staked as collateral. Scores determine how much weight that agent\'s opinion carries in deliberation. Low-scoring agents get downvoted by the system.',
  },
  {
    icon: Swords,
    title: 'Dispute Resolution',
    subtitle: 'Adversarial re-trial',
    code: [
      'dispute(stake: 5 CSPR, reason: string)',
      '→ fresh jury, new evidence',
      '→ if challenge succeeds: stake returned',
      '→ if challenge fails: stake forfeited',
    ],
    description:
      'Anyone can challenge any verdict by staking 5 CSPR. The system triggers a completely fresh analysis with a new jury panel and allows new evidence. If the challenger is right, they get their stake back and the verdict is updated. A self-correcting system with no central authority.',
  },
];

export const SecurityAuditSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    gsap.from(headerRef.current, {
      y: 40,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });

    gridRefs.current.filter(Boolean).forEach((card, i) => {
      gsap.from(card, {
        y: 40,
        opacity: 0,
        duration: 0.6,
        delay: i * 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
      });
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} id="security" className="security-section">
      <div className="security-container">
        <div ref={headerRef} className="security-header">
          <span className="security-label">04 / SECURITY &amp; AUDIT</span>
          <h2 className="security-headline">Trust, but verify</h2>
          <p className="security-sub">
            Every execution is cryptographically receipted, every commitment is anchored on-chain,
            and every verdict can be challenged. No black boxes.
          </p>
        </div>

        <div className="security-grid">
          {LAYERS.map((layer, i) => {
            const Icon = layer.icon;
            return (
              <div
                key={layer.title}
                ref={(el) => { gridRefs.current[i] = el; }}
                className="security-card"
              >
                <div className="security-card__icon">
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <div className="security-card__content">
                  <h3 className="security-card__title">{layer.title}</h3>
                  <span className="security-card__subtitle">{layer.subtitle}</span>
                  <div className="security-card__code">
                    {layer.code.map((line, j) => (
                      <div key={j} className="security-code-line">
                        <span className="security-code-num">{j + 1}</span>
                        <span className="security-code-text">{line}</span>
                      </div>
                    ))}
                  </div>
                  <p className="security-card__desc">{layer.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="security-footer">
          <Shield size={16} strokeWidth={1.5} />
          <span>
            All verification runs client-side. The receipt chain, commitment hashes,
            and trust scores are independently computable from on-chain data.
          </span>
        </div>
      </div>
    </section>
  );
};
