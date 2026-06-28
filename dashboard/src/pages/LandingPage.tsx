import React from 'react';
import { ProductShowcase } from '../components/landing/ProductShowcase';
import { StatsSection } from '../components/landing/StatsSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { ClosingSection } from '../components/landing/ClosingSection';
import { Footer } from '../components/landing/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div style={{ position: 'relative', overflowX: 'hidden', background: '#020a13' }}>
      {/* HERO — UNTOUCHED */}
      {/* <HeroSection /> is rendered by the router/layout, not here */}

      <main>
        <ProductShowcase />
        <StatsSection />
        <FeaturesSection />
        <ClosingSection />
      </main>

      <Footer />
    </div>
  );
};
