import React from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   FACETED BACKGROUND
   Reusable geometric facet pattern extracted from the hero.
   
   Props:
   - intensity: 0–1, controls overall opacity of facet layers (default: 1)
   - animate: boolean, enables slow drift animation (default: false)
   - className: additional CSS classes
   
   Usage:
   <FacetedBackground intensity={0.8} />
   ═══════════════════════════════════════════════════════════════════════════ */

interface FacetedBackgroundProps {
  intensity?: number;
  animate?: boolean;
  className?: string;
}

export const FacetedBackground: React.FC<FacetedBackgroundProps> = ({
  intensity = 1,
  animate = false,
  className = '',
}) => {
  const opacity = {
    base: 1,
    f1: 0.85 * intensity,
    f2: 0.70 * intensity,
    f3: 0.60 * intensity,
    f4: 0.35 * intensity,
    noise: 0.50,
  };

  return (
    <div
      className={`faceted-bg ${animate ? 'faceted-bg--animate' : ''} ${className}`}
      aria-hidden="true"
    >
      {/* Layer 0: Base dark navy */}
      <div
        className="faceted-bg__layer faceted-bg__layer--base"
        style={{ opacity: opacity.base }}
      />

      {/* Layer 1: Large angular shard — top-left to center */}
      <div
        className="faceted-bg__layer faceted-bg__layer--1"
        style={{ opacity: opacity.f1 }}
      />

      {/* Layer 2: Medium shard — center-right */}
      <div
        className="faceted-bg__layer faceted-bg__layer--2"
        style={{ opacity: opacity.f2 }}
      />

      {/* Layer 3: Small accent shard — bottom-left */}
      <div
        className="faceted-bg__layer faceted-bg__layer--3"
        style={{ opacity: opacity.f3 }}
      />

      {/* Layer 4: Highlight shard — top-right */}
      <div
        className="faceted-bg__layer faceted-bg__layer--4"
        style={{ opacity: opacity.f4 }}
      />

      {/* Layer 5: Noise/grain overlay */}
      <div
        className="faceted-bg__layer faceted-bg__layer--noise"
        style={{ opacity: opacity.noise }}
      />
    </div>
  );
};
