import React, { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── Live data fetcher ────────────────────────────────────────────────────────

interface LiveStats {
  valuations: number;
  agents: number;
  contracts: number;
  onChainTx: number;
}

const ORCHESTRATOR_URL = import.meta.env.VITE_ORCHESTRATOR_URL || (import.meta.env.PROD ? 'https://verdicto-production.up.railway.app' : '');
const FALLBACK_STATS: LiveStats = { valuations: 0, agents: 5, contracts: 3, onChainTx: 0 };

async function fetchLiveStats(): Promise<LiveStats> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/api/contract-state`);
    if (!res.ok) return FALLBACK_STATS;
    const data = await res.json();
    if (!data.success) return FALLBACK_STATS;
    const state = data.state || data;
    const agents = (state.agents || []).length || 5;
    // Count total assessments from agents
    const valuations = (state.agents || []).reduce(
      (sum: number, a: any) => sum + (a.totalAssessments || 0), 0
    );
    // Count on-chain transactions from the endpoint
    const onChainTx = state.onChainTransactions || state.totalTransactions || 0;
    // Contracts: always 3 (VerdictOracle, ReputationRegistry, VotingContract)
    const contracts = 3;
    return { valuations, agents, contracts, onChainTx };
  } catch {
    return FALLBACK_STATS;
  }
}

// ─── Animated Counter ─────────────────────────────────────────────────────────

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

// ─── Main Component ───────────────────────────────────────────────────────────

export const StatsSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [liveStats, setLiveStats] = useState<LiveStats>(FALLBACK_STATS);
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    fetchLiveStats().then(stats => {
      setLiveStats(stats);
      setStatsLoaded(true);
    });
    // Refresh every 60s so values grow as background activity runs
    const interval = setInterval(() => {
      fetchLiveStats().then(setLiveStats);
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Use live data once loaded, otherwise show minimum values for first paint
  const stats = [
    { value: liveStats.valuations || 0, suffix: '+', label: 'valuations', sub: 'completed', isPrimary: true },
    { value: liveStats.agents || 5, suffix: '', label: 'agents', sub: 'active', isPrimary: false },
    { value: liveStats.contracts || 3, suffix: '', label: 'contracts', sub: 'deployed', isPrimary: false },
    { value: liveStats.onChainTx || 0, suffix: '', label: 'on-chain tx', sub: 'verified', isPrimary: false },
  ];

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
          {stats.map((stat) => (
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
