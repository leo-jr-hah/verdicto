import React, { useEffect } from 'react';
import { useLenis } from '../hooks/useLenis';
import { Navigation } from '../components/landing/Navigation';
import { HeroSection } from '../components/landing/HeroSection';
import { StatsBar } from '../components/landing/StatsBar';
import { HowItWorks } from '../components/landing/HowItWorks';
import { AgentGrid } from '../components/landing/AgentGrid';
import { X402PaymentFlow } from '../components/landing/X402PaymentFlow';
import { ContractCards } from '../components/landing/ContractCards';
import { ArchitectureDiagram } from '../components/landing/ArchitectureDiagram';
import { TestnetProof } from '../components/landing/TestnetProof';
import { CTASection } from '../components/landing/CTASection';
import { Footer } from '../components/landing/Footer';
import { ParticleField, CursorGlow } from '../components/landing/Backgrounds';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export const LandingPage: React.FC = () => {
  // Initialize Lenis smooth scrolling and GSAP sync
  useLenis();

  useEffect(() => {
    // Refresh ScrollTrigger after all content mounts to ensure accurate positions
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
  }, []);

  return (
    <div style={{ position: 'relative', overflowX: 'hidden', background: 'var(--bg-main)' }}>
      <Navigation />

      {/* Global Background Layer */}
      <ParticleField count={35} />
      <CursorGlow />

      {/* Main Content Area */}
      <main style={{ position: 'relative', zIndex: 10 }}>
        <HeroSection />
        <StatsBar />
        <HowItWorks />
        <AgentGrid />
        <X402PaymentFlow />
        <ContractCards />
        <ArchitectureDiagram />
        <TestnetProof />
        <CTASection />
      </main>

      {/* Footer */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Footer />
      </div>
    </div>
  );
};
