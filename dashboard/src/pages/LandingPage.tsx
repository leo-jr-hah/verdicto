import React from 'react';
import { TrustSection } from '../components/landing/TrustSection';
import { ProcessSection } from '../components/landing/ProcessSection';
import { LiveStateSection } from '../components/landing/LiveStateSection';
import { ContractProofSection } from '../components/landing/ContractProofSection';
import { ClosingCTA } from '../components/landing/ClosingCTA';
import { Footer } from '../components/landing/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div style={{ position: 'relative', overflowX: 'hidden', background: 'var(--navy-950)' }}>
      {/* HERO — UNTOUCHED */}
      {/* <HeroSection /> is rendered by the router/layout, not here */}

      <main>
        <TrustSection />
        <ProcessSection />
        <LiveStateSection />
        <ContractProofSection />
        <ClosingCTA />
      </main>

      <Footer />
    </div>
  );
};
