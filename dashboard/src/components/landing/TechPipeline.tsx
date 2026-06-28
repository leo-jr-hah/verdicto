import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PIPELINE_STEPS = [
  { label: 'Asset Submitted', detail: 'x402 payment + wallet signature' },
  { label: 'Agents Analyze', detail: 'Two independent valuations' },
  { label: 'Jury Deliberates', detail: 'HMAC-signed receipt chain' },
  { label: 'Verdict Recorded', detail: 'Consensus stored on-chain' },
  { label: 'Receipt Anchored', detail: 'ZK-Lite commitment to Casper' },
];

export const TechPipeline: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    // SVG path: draw-in animation
    const tlSvg = gsap.timeline({ paused: true });

    const path = svgRef.current?.querySelector('.pipeline-path');
    if (path) {
      const length = 900; // hardcoded path length
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      tlSvg.to(path, {
        strokeDashoffset: 0,
        duration: 2,
        ease: 'power2.inOut',
      });
    }

    // Step nodes: staggered fade-up after path draws
    const tlSteps = gsap.timeline({ paused: true });

    tlSteps.from(stepRefs.current.filter(Boolean), {
      y: 20,
      opacity: 0,
      duration: 0.5,
      stagger: 0.15,
      ease: 'power2.out',
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          tlSvg.play();
          setTimeout(() => tlSteps.play(), 200); // Slight delay for steps
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (svgRef.current) observer.observe(svgRef.current);
  });

  const stepWidth = 100 / PIPELINE_STEPS.length;

  return (
    <div className="pipeline-wrap">
      <svg
        ref={svgRef}
        className="pipeline-svg"
        viewBox="0 0 1000 80"
        preserveAspectRatio="none"
      >
        <path
          className="pipeline-path"
          d="M 50 40 L 950 40"
          fill="none"
          stroke="rgba(201,168,76,0.4)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {PIPELINE_STEPS.map((_, i) => {
          const x = 50 + (i * (900 / (PIPELINE_STEPS.length - 1)));
          return (
            <g key={i}>
              <circle cx={x} cy="40" r="6" fill="var(--navy-950)" stroke="var(--accent)" strokeWidth="2" />
            </g>
          );
        })}
      </svg>

      <div className="pipeline-steps" style={{ width: '100%' }}>
        {PIPELINE_STEPS.map((step, i) => (
          <div
            key={step.label}
            ref={(el) => { stepRefs.current[i] = el; }}
            className="pipeline-step"
            style={{ width: `${stepWidth}%` }}
          >
            <span className="pipeline-step-label">{step.label}</span>
            <span className="pipeline-step-detail">{step.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
