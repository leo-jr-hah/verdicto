import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BarChart3, Scale, Link2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    num: '01',
    title: 'Assess',
    body: 'Submit asset details. Two independent AI analysts evaluate using real-world data from RentCast, FRED, and proprietary models. Each produces a signed valuation with confidence bounds.',
    layout: 'image-left',
    icon: <BarChart3 size={32} />,
    placeholder: { label: 'Asset Analysis', items: ['RentCast Data', 'FRED Economic', 'Market Comparables'] },
  },
  {
    num: '02',
    title: 'Deliberate',
    body: 'Three specialized jurors review the evidence and cast votes. Every deliberation round produces an HMAC-SHA256 receipt that chains to the previous. Tamper-proof by construction.',
    layout: 'image-right',
    icon: <Scale size={32} />,
    placeholder: { label: 'Jury Deliberation', items: ['Juror A: Affirmed', 'Juror B: Affirmed', 'Juror C: Dissent'] },
  },
  {
    num: '03',
    title: 'Commit',
    body: 'A cryptographic commitment — SHA-256 of the full execution state plus the Casper block height — anchors the verdict on-chain. Any third party can independently verify.',
    layout: 'image-left',
    icon: <Link2 size={32} />,
    placeholder: { label: 'On-Chain Commit', items: ['Block #1,847,293', 'SHA-256: 0xa7f3...c9d1', 'Status: Finalized'] },
  },
];

export const FeaturesSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const items = sectionRef.current?.querySelectorAll('.feature-item');
    if (!items) return;

    items.forEach((item, i) => {
      const image = item.querySelector('.feature-image-wrap');
      const text = item.querySelector('.feature-text');
      const isLeft = i % 2 === 0;

      // Image: enters from its side with 3D rotation
      gsap.set(image, { x: isLeft ? -100 : 100, rotateY: isLeft ? 15 : -15, opacity: 0 });
      gsap.to(image, {
        x: 0,
        rotateY: 0,
        opacity: 1,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: item,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });

      // Text: staggered line reveal
      const lines = text?.querySelectorAll('.feature-reveal');
      if (lines) {
        gsap.set(lines, { y: 30, opacity: 0 });
        gsap.to(lines, {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        });
      }
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="features-section">
      <div className="features-container">
        <span className="section-num">05 / CAPABILITIES</span>

        <div className="features-list">
          {FEATURES.map((feat) => (
            <div
              key={feat.num}
              className={`feature-item feature-item--${feat.layout}`}
            >
              <div className="feature-image-wrap">
                <div className="feature-image-placeholder">
                  <div className="feature-placeholder__icon">{feat.icon}</div>
                  <div className="feature-placeholder__label">{feat.placeholder.label}</div>
                  <div className="feature-placeholder__items">
                    {feat.placeholder.items.map((item, j) => (
                      <div key={j} className="feature-placeholder__item">
                        <span className="feature-placeholder__dot" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="feature-text">
                <span className="feature-reveal feature-num">{feat.num}</span>
                <h3 className="feature-reveal feature-title">{feat.title}</h3>
                <p className="feature-reveal feature-body">{feat.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
