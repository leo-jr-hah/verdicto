import React, { useRef, useEffect, useCallback } from 'react';
import { Reveal } from './UIComponents';
import { CheckCircle2 } from 'lucide-react';

const NODES = [
  { label: 'User Wallet', icon: 'wallet' },
  { label: 'Orchestrator', icon: 'gear' },
  { label: 'Agent MCP Server', icon: 'server' },
  { label: 'Agent Response', icon: 'doc' }
];

const NodeIcon = ({ type }: { type: string }) => {
  const size = 20;
  const color = '#6B7280';
  const props: React.SVGProps<SVGSVGElement> = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (type) {
    case 'wallet':
      return <svg {...props}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/></svg>;
    case 'gear':
      return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    case 'server':
      return <svg {...props}><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>;
    case 'doc':
      return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg>;
    default:
      return null;
  }
};

const BOX_W = 180, BOX_H = 44, BOX_R = 10;
const CX = 160;
const BL = CX - BOX_W / 2;
const BR = CX + BOX_W / 2;
const TOPS = [60, 165, 270, 375];

function buildMotionPath(): string {
  const parts: string[] = [`M ${CX} 10`];
  for (let i = 0; i < 4; i++) {
    const t = TOPS[i], b = t + BOX_H;
    parts.push(`L ${CX} ${t}`);
    parts.push(`L ${BR - BOX_R} ${t}`);
    parts.push(`A ${BOX_R} ${BOX_R} 0 0 1 ${BR} ${t + BOX_R}`);
    parts.push(`L ${BR} ${b - BOX_R}`);
    parts.push(`A ${BOX_R} ${BOX_R} 0 0 1 ${BR - BOX_R} ${b}`);
    parts.push(`L ${BL + BOX_R} ${b}`);
    parts.push(`A ${BOX_R} ${BOX_R} 0 0 1 ${BL} ${b - BOX_R}`);
    parts.push(`L ${BL} ${t + BOX_R}`);
    parts.push(`A ${BOX_R} ${BOX_R} 0 0 1 ${BL + BOX_R} ${t}`);
    parts.push(`L ${CX} ${t}`);
  }
  parts.push(`L ${CX} ${TOPS[3] + BOX_H + 20}`);
  return parts.join(' ');
}

const MOTION_D = buildMotionPath();
const ANIM_DURATION = 10;

export const X402PaymentFlow: React.FC = () => {
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const trailRef = useRef<SVGCircleElement>(null);
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  const animate = useCallback((now: number) => {
    if (!startRef.current) startRef.current = now;
    const elapsed = (now - startRef.current) / 1000;
    const progress = (elapsed % ANIM_DURATION) / ANIM_DURATION;
    const path = pathRef.current;

    if (path) {
      const len = path.getTotalLength();
      const pt = path.getPointAtLength(progress * len);
      if (dotRef.current) { dotRef.current.setAttribute('cx', String(pt.x)); dotRef.current.setAttribute('cy', String(pt.y)); }
      if (glowRef.current) { glowRef.current.setAttribute('cx', String(pt.x)); glowRef.current.setAttribute('cy', String(pt.y)); }
      const trailProgress = ((elapsed - 0.25) % ANIM_DURATION) / ANIM_DURATION;
      const trailPt = path.getPointAtLength(Math.max(0, trailProgress) * len);
      if (trailRef.current) { trailRef.current.setAttribute('cx', String(trailPt.x)); trailRef.current.setAttribute('cy', String(trailPt.y)); }
    }
    animRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [animate]);

  return (
    <section className="x402-section">
      <div className="x402-layout">
        {/* Left Side: Text */}
        <div className="x402-text">
          <Reveal direction="left" duration={0.7}>
            <div className="landing-badge landing-badge--red">
              x402 Protocol
            </div>
            <h2 className="landing-section__title" style={{ textAlign: 'left', marginBottom: '20px' }}>
              Real CSPR.<br/>Real Agents.<br/>Real Payments.
            </h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
              The Orchestrator creates native CSPR transfer deploys for every agent request. Each agent validates the cryptographic proof before responding. On-chain settlement for every API call.
            </p>
            <div className="x402-check-list">
              {[
                '2.5 CSPR per assessment',
                'HMAC-signed receipt chain',
                'Verifiable on testnet.cspr.live'
              ].map((text, i) => (
                <div key={i} className="x402-check-item">
                  <CheckCircle2 size={18} color="var(--primary)" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Right Side: Animated Diagram */}
        <div className="x402-diagram">
          <Reveal direction="right" delay={0.3} duration={0.7}>
            <div className="card x402-diagram-card">
              <svg viewBox="0 0 320 440" className="x402-diagram-svg">
                <defs>
                  <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="5" result="blur"/>
                    <feMerge>
                      <feMergeNode in="blur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <path ref={pathRef} d={MOTION_D} fill="none" stroke="none"/>
                <circle ref={trailRef} r="10" fill="var(--primary)" opacity="0.15"/>
                <circle ref={glowRef} r="16" fill="var(--primary)" opacity="0.12" filter="url(#dotGlow)"/>
                <circle ref={dotRef} r="5" fill="var(--primary)"/>
              </svg>
              <div className="x402-nodes">
                {NODES.map((node, i) => (
                  <div key={i} className="x402-node">
                    <div className="card x402-node-card" style={{ border: '1px solid var(--border-color)' }}>
                      <NodeIcon type={node.icon} />
                      {node.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
