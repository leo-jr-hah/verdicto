import React, { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Reveal } from './Reveal';
import { Wallet, Cpu, BarChart2, TrendingUp, Search, FileText, Activity, Database, Shield, Globe } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// Utility to render an SVG node
const SvgNode = ({ id, x, y, label, Icon, borderColor }: any) => (
  <g className="arch-node" id={id} transform={`translate(${x}, ${y})`} style={{ opacity: 0 }}>
    <rect x="-75" y="-20" width="150" height="40" rx="12" fill="var(--bg-elevated)" stroke="var(--border-color)" strokeWidth="1" />
    <path d={`M -75 -8 L -75 8`} stroke={borderColor} strokeWidth="8" strokeLinecap="round" />
    <g transform="translate(-55, -8)">
      {Icon && <Icon size={16} color={borderColor} />}
      {!Icon && <text x="8" y="12" fontSize="12" fill={borderColor} fontWeight="bold" textAnchor="middle">CSPR</text>}
    </g>
    <text x="-30" y="4" fontSize="12" fill="var(--text-primary)" fontWeight="600" dominantBaseline="middle">{label}</text>
  </g>
);

export const ArchitectureDiagram: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 70%',
        }
      });

      // Phase 1: Reveal nodes
      tl.to('.arch-node', {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        stagger: 0.05,
        ease: 'back.out(1.5)',
        onStart: () => {
          gsap.set('.arch-node', { scale: 0.8 });
        }
      });

      // Phase 2: Draw edges
      const paths = document.querySelectorAll('.arch-edge');
      paths.forEach(path => {
        const length = (path as SVGPathElement).getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length, opacity: 0.6 });
      });

      tl.to('.arch-edge', {
        strokeDashoffset: 0,
        duration: 1,
        stagger: 0.1,
        ease: 'power2.inOut'
      }, '-=0.2');

      // Phase 3: Packet Flow (looping)
      tl.add(() => {
        // This is a simplified fallback for motionPath if it's not registered
        // Actually, since motionPath is not requested to be installed, we will use simple dash offsets or opacity for packets
        // Instead of motion path, we animate stroke-dashoffset on a clone of the path with a short dash array
        const packetPaths = document.querySelectorAll('.packet-path');
        packetPaths.forEach(path => {
          const length = (path as SVGPathElement).getTotalLength();
          const color = path.getAttribute('data-color') || '#FF3B3B';
          gsap.set(path, { 
            strokeDasharray: `8 ${length}`, 
            strokeDashoffset: length,
            stroke: color,
            strokeWidth: 3,
            opacity: 1
          });
          gsap.to(path, {
            strokeDashoffset: 0,
            duration: 2,
            repeat: -1,
            ease: 'none',
            delay: Math.random() * 1
          });
        });

      }, '+=0');

      // Ambient pulsing
      gsap.to('.arch-node rect', {
        fill: 'var(--bg-surface)',
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.2
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: '96px 32px' }}>
      <Reveal direction="up" delay={0}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{
            fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)',
            marginBottom: '16px', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em'
          }}>
            How Verdict Works
          </h2>
        </div>
      </Reveal>

      <div ref={containerRef} style={{ width: '100%', overflowX: 'auto' }}>
        <svg ref={svgRef} viewBox="0 0 1000 600" style={{ width: '100%', minWidth: 800, height: 'auto' }}>
          {/* Edges */}
          <g fill="none" stroke="var(--border-color)" strokeWidth="1.5">
            {/* User -> Orchestrator */}
            <path id="e1" className="arch-edge" d="M 200 100 L 425 100" />
            {/* Orchestrator -> Data Sources */}
            <path id="e2" className="arch-edge" d="M 425 120 C 350 170, 250 170, 225 200" />
            {/* Orchestrator -> Comps Specialist */}
            <path id="e3" className="arch-edge" d="M 425 120 C 350 170, 300 170, 300 230" />
            {/* Orchestrator -> DCF Specialist */}
            <path id="e4" className="arch-edge" d="M 575 120 C 650 170, 700 170, 700 230" />
            {/* Comps Specialist -> Jurors */}
            <path id="e5" className="arch-edge" d="M 300 270 C 300 310, 200 310, 200 350" />
            <path id="e6" className="arch-edge" d="M 300 270 C 300 310, 500 310, 500 350" />
            <path id="e7" className="arch-edge" d="M 300 270 C 300 310, 800 310, 800 350" />
            {/* DCF Specialist -> Jurors */}
            <path id="e8" className="arch-edge" d="M 700 270 C 700 310, 200 310, 200 350" />
            <path id="e9" className="arch-edge" d="M 700 270 C 700 310, 500 310, 500 350" />
            <path id="e10" className="arch-edge" d="M 700 270 C 700 310, 800 310, 800 350" />
            {/* Jurors -> Verdict */}
            <path id="e11" className="arch-edge" d="M 200 390 C 200 430, 500 430, 500 440" />
            <path id="e12" className="arch-edge" d="M 500 390 L 500 440" />
            <path id="e13" className="arch-edge" d="M 800 390 C 800 430, 500 430, 500 440" />
            {/* Verdict -> Blockchain */}
            <path id="e14" className="arch-edge" d="M 500 480 L 500 520" />
          </g>

          {/* Packet Paths (Overlay for animation) */}
          <g fill="none">
            <path className="packet-path" data-color="#FF3B3B" d="M 425 120 C 350 170, 300 170, 300 230" />
            <path className="packet-path" data-color="#FF3B3B" d="M 575 120 C 650 170, 700 170, 700 230" />
            <path className="packet-path" data-color="#3B82F6" d="M 300 270 C 300 310, 500 310, 500 350" />
            <path className="packet-path" data-color="#3B82F6" d="M 700 270 C 700 310, 500 310, 500 350" />
            <path className="packet-path" data-color="#10B981" d="M 500 390 L 500 440" />
            <path className="packet-path" data-color="#10B981" d="M 500 480 L 500 520" />
          </g>

          {/* Nodes */}
          <SvgNode id="n1" x={200} y={100} label="Your Asset" Icon={Wallet} borderColor="#FF3B3B" />
          <SvgNode id="n2" x={500} y={100} label="Orchestrator" Icon={Cpu} borderColor="#8B5CF6" />
          <SvgNode id="n3" x={225} y={200} label="Data Sources" Icon={Database} borderColor="#6366f1" />
          <SvgNode id="n4" x={300} y={250} label="Comps Specialist" Icon={BarChart2} borderColor="#EC4899" />
          <SvgNode id="n5" x={700} y={250} label="DCF Specialist" Icon={TrendingUp} borderColor="#F97316" />
          <SvgNode id="n6" x={200} y={370} label="Evidence Analyst" Icon={FileText} borderColor="#10B981" />
          <SvgNode id="n7" x={500} y={370} label="Market Interpreter" Icon={Activity} borderColor="#06B6D4" />
          <SvgNode id="n8" x={800} y={370} label="Precedent Researcher" Icon={Search} borderColor="#8B5CF6" />
          <SvgNode id="n9" x={500} y={460} label="Verdict" Icon={Shield} borderColor="#10B981" />
          <SvgNode id="n10" x={500} y={540} label="Casper Blockchain" Icon={Globe} borderColor="#22D3EE" />
        </svg>
      </div>
    </section>
  );
};
