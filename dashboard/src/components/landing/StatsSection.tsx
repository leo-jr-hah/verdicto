import React, { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const STATS = [
  { value: 2847, suffix: '+', label: 'valuations', sub: 'completed', isPrimary: true },
  { value: 5, suffix: '', label: 'agents', sub: 'active', isPrimary: false },
  { value: 3, suffix: '', label: 'contracts', sub: 'deployed', isPrimary: false },
  { value: 29, suffix: '', label: 'on-chain tx', sub: 'verified', isPrimary: false },
];

function AnimatedCounter({ target, suffix, isPrimary }: { target: number; suffix: string; isPrimary: boolean }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasAnimated.current) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: () => {
        if (hasAnimated.current) return;
        hasAnimated.current = true;

        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 2,
          ease: 'power2.out',
          onUpdate: () => setCount(Math.round(obj.val)),
        });
      },
    });

    return () => trigger.kill();
  }, [target]);

  return (
    <span ref={ref} className={`stat-number ${isPrimary ? 'stat-number--primary' : ''}`}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export const StatsSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Headline: clip-path reveal from left
    gsap.set(headlineRef.current, { clipPath: 'inset(0 100% 0 0)' });
    gsap.to(headlineRef.current, {
      clipPath: 'inset(0 0% 0 0)',
      duration: 0.9,
      ease: 'power3.inOut',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });

    // Stat columns: staggered scale-in from below
    const cols = gridRef.current?.querySelectorAll('.stat-col');
    if (cols) {
      gsap.set(cols, { y: 60, scale: 0.92, opacity: 0 });
      gsap.to(cols, {
        y: 0,
        scale: 1,
        opacity: 1,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: gridRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    }
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="stats-section">
      <div className="stats-container">
        <span className="section-num">04 / TRACTION</span>
        <h2 ref={headlineRef} className="stats-headline">Built for scale</h2>

        <div ref={gridRef} className="stats-grid">
          {STATS.map((stat) => (
            <div key={stat.label} className="stat-col">
              <AnimatedCounter
                target={stat.value}
                suffix={stat.suffix}
                isPrimary={stat.isPrimary}
              />
              <span className={`stat-label ${stat.isPrimary ? 'stat-label--primary' : ''}`}>
                {stat.label}
              </span>
              <span className="stat-sub">{stat.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
