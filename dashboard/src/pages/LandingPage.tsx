import React from 'react';
import { OracleSection } from '../components/landing/OracleSection';
import { HowItWorks } from '../components/landing/HowItWorks';
import { AgentGrid } from '../components/landing/AgentGrid';
import { X402PaymentFlow } from '../components/landing/X402PaymentFlow';
import { ContractCards } from '../components/landing/ContractCards';
import { TestnetProof } from '../components/landing/TestnetProof';
import { Footer } from '../components/landing/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div style={{ position: 'relative', overflowX: 'hidden', background: 'var(--bg-dark)' }}>
      <main>
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
