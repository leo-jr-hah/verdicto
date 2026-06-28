import React from 'react';
import { ArchitectureDiagram } from '../components/landing/ArchitectureDiagram';

export const ArchitectureView: React.FC = () => {
  return (
    <div className="arch-page">
      <section className="arch-section">
        <ArchitectureDiagram />
      </section>
    </div>
  );
};
