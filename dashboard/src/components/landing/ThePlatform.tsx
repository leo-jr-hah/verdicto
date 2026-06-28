import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PRODUCTS = [
  {
    name: 'Assess',
    tagline: 'Multi-agent asset valuation',
    description:
      'Two independent AI analysts value the same asset using different methodologies — comparable sales, DCF, income approach. A three-juror panel deliberates and votes. Every deliberation step is HMAC-signed and chained to the previous receipt, producing a tamper-evident audit trail. Consensus verdict stored on-chain.',
  },
  {
    name: 'Borrow',
    tagline: 'Collateralized lending against assessed assets',
    description:
      'Use an assessment as collateral. AI determines loan-to-value ratio based on agent confidence and value divergence. Real CSPR disbursement. Autonomous keeper monitors collateral health continuously.',
  },
  {
    name: 'Insure',
    tagline: 'AI-underwritten asset insurance',
    description:
      'AI generates a risk score, premium, and coverage terms based on the same valuation data. File claims with automatic revaluation — if value has dropped, the system pays out.',
  },
  {
    name: 'Predict',
    tagline: 'Event-driven oracle resolution',
    description:
      'Ask any yes/no question about future outcomes. Independent AI analysts research and forecast. Oracle resolves on-chain. Disputable through the same jury process.',
  },
];

export const ThePlatform: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Header reveal
    const headerEls = headerRef.current?.querySelectorAll('.platform-reveal');
    if (headerEls) {
      gsap.set(headerEls, { y: 40, opacity: 0 });
      gsap.to(headerEls, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      });
    }

    // Cards stagger in
    const cards = gridRef.current?.querySelectorAll('.platform-card');
    if (cards) {
      gsap.set(cards, { y: 60, opacity: 0 });
      gsap.to(cards, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: gridRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });
    }
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="lp-section lp-platform">
      <div className="lp-section__inner">
        <div ref={headerRef}>
          <span className="section-num platform-reveal">02 — THE PLATFORM</span>
          <h2 className="lp-headline platform-reveal">
            Four products. One analytical engine.
          </h2>
          <p className="lp-subheadline platform-reveal">
            Every product on Verdicto runs on the same multi-agent valuation and deliberation
            infrastructure. Assess an asset, borrow against it, insure it, or resolve a dispute,
            the underlying process is identical: independent AI agents analyze, a jury
            deliberates, and the verdict is recorded on Casper.
          </p>
        </div>

        <div ref={gridRef} className="platform-grid">
          {PRODUCTS.map((product) => (
            <div key={product.name} className="platform-card">
              <h3 className="platform-card__name">{product.name}</h3>
              <p className="platform-card__tagline">{product.tagline}</p>
              <p className="platform-card__description">{product.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
