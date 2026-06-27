import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import { FacetedBackground } from '../FacetedBackground';

gsap.registerPlugin(ScrollTrigger);

export const ClosingCTA: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(contentRef.current, {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 70%',
        toggleActions: 'play none none none',
      },
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="closing-section">
      <FacetedBackground intensity={0.5} />
      <div ref={contentRef} className="closing-content">
        <h2 className="closing-headline">Ready to verify?</h2>
        <p className="closing-body">
          Connect your wallet and run your first valuation. No accounts, no API keys.
        </p>
        <Link to="/assess" className="btn-primary closing-btn">
          Start a Valuation
        </Link>
      </div>
    </section>
  );
};
