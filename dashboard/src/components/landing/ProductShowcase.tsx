import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const ProductShowcase: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Text: staggered reveal — words fade in with slight Y offset
    const words = textRef.current?.querySelectorAll('.reveal-word');
    if (words) {
      gsap.from(words, {
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.06,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      });
    }

    // Mockup: 3D perspective shift on scroll (scrubbed)
    gsap.fromTo(
      mockupRef.current,
      { rotateY: -12, rotateX: 6, y: 80 },
      {
        rotateY: -4,
        rotateX: 2,
        y: -40,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.8,
        },
      }
    );

    // Mockup shadow intensifies as it approaches center
    gsap.fromTo(
      mockupRef.current,
      { boxShadow: '0 40px 80px rgba(0,0,0,0.3)' },
      {
        boxShadow: '0 60px 120px rgba(0,0,0,0.5), 0 0 40px rgba(201,168,76,0.08)',
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'center center',
          scrub: true,
        },
      }
    );
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="showcase-section">
      <div className="showcase-grid">
        <div ref={textRef} className="showcase-text">
          <span className="section-num">03 / PRODUCT</span>
          <h2 className="showcase-headline">
            {'See Verdicto in Action'.split(' ').map((word, i) => (
              <span key={i} className="reveal-word">{word}</span>
            ))}
          </h2>
          <p className="showcase-body">
            Get real-world asset valuations through five-agent consensus.
            Each assessment produces a cryptographically signed verdict
            anchored to the Casper blockchain.
          </p>
        </div>

        <div className="showcase-visual">
          <div ref={mockupRef} className="showcase-mockup">
            <img
              src="/assets/verdicto-dashboard-screenshot.jpg"
              alt="Verdicto valuation dashboard showing a real estate assessment with confidence across three methodologies"
              className="showcase-mockup__img"
            />
            <div className="showcase-mockup__glow" />
          </div>
        </div>
      </div>
    </section>
  );
};
