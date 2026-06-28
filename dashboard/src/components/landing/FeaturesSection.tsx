import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    num: '01',
    title: 'Assess',
    body: 'Submit asset details. Two independent AI analysts evaluate using real-world data from RentCast, FRED, and proprietary models. Each produces a signed valuation with confidence bounds.',
    image: '/assets/feature-assess.jpg',
    layout: 'image-left',
  },
  {
    num: '02',
    title: 'Deliberate',
    body: 'Three specialized jurors review the evidence and cast votes. Every deliberation round produces an HMAC-SHA256 receipt that chains to the previous. Tamper-proof by construction.',
    image: '/assets/feature-deliberate.jpg',
    layout: 'image-right',
  },
  {
    num: '03',
    title: 'Commit',
    body: 'A cryptographic commitment — SHA-256 of the full execution state plus the Casper block height — anchors the verdict on-chain. Any third party can independently verify.',
    image: '/assets/feature-commit.jpg',
    layout: 'image-left',
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
      gsap.from(image, {
        x: isLeft ? -100 : 100,
        rotateY: isLeft ? 15 : -15,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: item,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });

      // Text: staggered line reveal
      const lines = text?.querySelectorAll('.feature-reveal');
      if (lines) {
        gsap.from(lines, {
          y: 30,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 75%',
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
                <img
                  src={feat.image}
                  alt={`${feat.title} feature`}
                  className="feature-image"
                  loading="lazy"
                />
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
