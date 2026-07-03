import React from 'react';
import { ProblemSection } from '../components/landing/ProblemSection';
import { PlatformSection } from '../components/landing/PlatformSection';
import { TechnologySection } from '../components/landing/TechnologySection';
import { AudienceSection } from '../components/landing/AudienceSection';
import { ClosingCTA } from '../components/landing/ClosingCTA';
import { Footer } from '../components/landing/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div style={{ position: 'relative', overflowX: 'hidden' }}>
      {/* HERO is rendered by LandingLayout, not here */}

      <main>
        <ProblemSection />
        <PlatformSection />
        <TechnologySection />
        <AudienceSection />
        <ClosingCTA />
      </main>

      <Footer />
    </div>
  );
};
