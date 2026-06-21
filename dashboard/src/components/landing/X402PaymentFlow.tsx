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

/*
  Path geometry:
  - SVG viewBox: 0 0 320 440
  - 4 node boxes, each 180×44, centered at x=160
  - Box left=70, right=250, corner radius=10
  - Node tops: y = 60, 165, 270, 375
  - Path starts at top (160, 10), goes to first box top-center,
    traces clockwise perimeter, continues to next box, etc.
*/
const BOX_W = 180, BOX_H = 44, BOX_R = 10;
const CX = 160;
const BL = CX - BOX_W / 2;  // 70
const BR = CX + BOX_W / 2;  // 250
const TOPS = [60, 165, 270, 375];

function buildMotionPath(): string {
  const parts: string[] = [`M ${CX} 10`];
  for (let i = 0; i < 4; i++) {
    const t = TOPS[i], b = t + BOX_H;
    // Travel down to box top-center
    parts.push(`L ${CX} ${t}`);
    // Trace perimeter clockwise (top-center → top-right → bottom-right → bottom-left → top-left → top-center)
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
  // Continue past last box
  parts.push(`L ${CX} ${TOPS[3] + BOX_H + 20}`);
  return parts.join(' ');
}

const MOTION_D = buildMotionPath();
const ANIM_DURATION = 10; // seconds per full loop

export const X402PaymentFlow: React.FC = () => {
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const trailRef = useRef<SVGCircleElement>(null);

  // Animated dot position along path using requestAnimationFrame
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  const animate = useCallback((now: number) => {
    if (!startRef.current) startRef.current = now;
    const elapsed = (now - startRef.current) / 1000; // seconds
    const progress = (elapsed % ANIM_DURATION) / ANIM_DURATION; // 0..1
    const path = pathRef.current;

    if (path) {
      const len = path.getTotalLength();
      const pt = path.getPointAtLength(progress * len);

      // Main dot
      if (dotRef.current) {
        dotRef.current.setAttribute('cx', String(pt.x));
        dotRef.current.setAttribute('cy', String(pt.y));
      }
      // Glow behind dot
      if (glowRef.current) {
        glowRef.current.setAttribute('cx', String(pt.x));
        glowRef.current.setAttribute('cy', String(pt.y));
      }
      // Trail (slightly behind)
      const trailProgress = ((elapsed - 0.25) % ANIM_DURATION) / ANIM_DURATION;
      const trailPt = path.getPointAtLength(Math.max(0, trailProgress) * len);
      if (trailRef.current) {
        trailRef.current.setAttribute('cx', String(trailPt.x));
        trailRef.current.setAttribute('cy', String(trailPt.y));
      }
    }

    animRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [animate]);

  return (
    <section style={{ width: '100%', background: 'var(--bg-main)', padding: '96px 32px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '48px', alignItems: 'center' }}>
        
        {/* Left Side: Text */}
        <div style={{ flex: '1 1 400px' }}>
          <Reveal direction="left" duration={0.7}>
            <div className="badge" style={{
              background: 'rgba(255,59,59,0.1)',
              color: 'var(--primary)',
              border: '1px solid rgba(255,59,59,0.2)',
              marginBottom: '16px',
              display: 'inline-flex'
            }}>
              x402 Protocol
            </div>
            
            <h2 style={{
              fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)',
              marginBottom: '20px', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em',
              lineHeight: 1.1
            }}>
              Real CSPR.<br/>Real Agents.<br/>Real Payments.
            </h2>
            
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
              The Orchestrator creates native CSPR transfer deploys for every agent request. Each agent validates the cryptographic proof before responding. No credits. No promises. On-chain settlement for every API call.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                '2.5 CSPR per assessment',
                'HMAC-signed receipt chain',
                'Verifiable on testnet.cspr.live'
              ].map((text, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle2 size={18} color="var(--primary)" />
                  <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Right Side: Animated Diagram */}
        <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
          <Reveal direction="right" delay={0.3} duration={0.7}>
            <div className="card" style={{
              position: 'relative',
              width: 320,
              height: 440,
              padding: '32px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
            }}>
              {/* SVG diagram with animated dot */}
              <svg
                viewBox="0 0 320 440"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}
              >
                <defs>
                  <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="5" result="blur"/>
                    <feMerge>
                      <feMergeNode in="blur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* The motion path (invisible, used for getPointAtLength) */}
                <path ref={pathRef} d={MOTION_D} fill="none" stroke="none"/>

                {/* Trail circle (behind main dot) */}
                <circle ref={trailRef} r="10" fill="var(--primary)" opacity="0.15"/>

                {/* Glow circle */}
                <circle ref={glowRef} r="16" fill="var(--primary)" opacity="0.12" filter="url(#dotGlow)"/>

                {/* Main dot */}
                <circle ref={dotRef} r="5" fill="var(--primary)"/>
              </svg>

              {/* Nodes */}
              <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 5 }}>
                {NODES.map((node, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
                    <div className="card" style={{
                      border: '1px solid var(--border-color)',
                      padding: '10px 20px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      minWidth: 160,
                      textAlign: 'center',
                      background: 'var(--bg-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}>
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
