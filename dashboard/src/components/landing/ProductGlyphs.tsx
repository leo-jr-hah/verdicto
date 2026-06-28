import React from 'react';

export const AssessGlyph: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M8 36 L16 24 L24 30 L32 14 L40 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="8" cy="36" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="16" cy="24" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="24" cy="30" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="32" cy="14" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="40" cy="20" r="2" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

export const BorrowGlyph: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="12" y="12" width="24" height="24" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12 20 L36 20" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M20 12 L20 36" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="28" cy="28" r="4" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M31 25 L34 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const InsureGlyph: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M24 6 L40 14 L40 24 C40 34 32 42 24 42 C16 42 8 34 8 24 L8 14 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M16 24 L22 30 L32 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const PredictGlyph: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="24" cy="24" r="4" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M24 4 L24 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M24 36 L24 44" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M4 24 L12 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M36 24 L44 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
