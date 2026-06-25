import React from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { StatsBar } from '../components/landing/StatsBar';
import { OracleSection } from '../components/landing/OracleSection';
import { HowItWorks } from '../components/landing/HowItWorks';
import { AgentGrid } from '../components/landing/AgentGrid';
import { X402PaymentFlow } from '../components/landing/X402PaymentFlow';
import { ContractCards } from '../components/landing/ContractCards';
import { TestnetProof } from '../components/landing/TestnetProof';
import { Footer } from '../components/landing/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div style={{ position: 'relative', overflowX: 'hidden', background: 'var(--bg-main)' }}>
      <main>
        <HeroSection />
        <StatsBar />
        <OracleSection />
        <HowItWorks />
        <AgentGrid />
        <X402PaymentFlow />
        <ContractCards />
        <TestnetProof />
      </main>

      <Footer />
    </div>
  );
};
