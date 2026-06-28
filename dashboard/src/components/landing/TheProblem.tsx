import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const TheProblem: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const els = contentRef.current?.querySelectorAll('.problem-reveal');
    if (!els) return;

    gsap.set(els, { y: 40, opacity: 0 });
    gsap.to(els, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 75%',
        toggleActions: 'play none none none',
      },
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="lp-section lp-problem">
      <div ref={contentRef} className="lp-section__inner">
        <span className="section-num problem-reveal">01 — THE PROBLEM</span>

        <h2 className="lp-headline problem-reveal">
          Real-world assets are a $400 trillion market.<br />
          Valuation is still broken.
        </h2>

        <p className="lp-subheadline problem-reveal">
          A single appraiser. A subjective opinion. Weeks of turnaround. No audit trail.
          No recourse. The largest asset class on earth runs on trust, and trust doesn't scale.
        </p>

        <p className="lp-body problem-reveal">
          Verdicto replaces subjective, single-point appraisals with a multi-agent AI system
          that independently analyzes assets, deliberates through a structured jury process,
          and records every decision on-chain. Every step, from raw input to final verdict,
          is captured in an HMAC-signed receipt chain: a tamper-evident, cryptographically
          linked audit trail where each receipt references the previous one. The result is a
          valuation you can verify, not one you have to take on faith.
        </p>
      </div>
    </section>
  );
};
