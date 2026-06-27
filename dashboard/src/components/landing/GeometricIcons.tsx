import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

export const ReceiptChainIcon: React.FC<IconProps> = (props) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M12 28C12 20 18 14 26 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M36 20C36 28 30 34 22 34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="26" cy="14" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="22" cy="34" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M16 20L20 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const DeliberationIcon: React.FC<IconProps> = (props) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="24" cy="24" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M24 8L24 18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M10 36L20.5 26.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M38 36L27.5 26.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="24" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="10" cy="36" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="38" cy="36" r="2" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

export const CommitmentIcon: React.FC<IconProps> = (props) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M24 6L40 15V33L24 42L8 33V15L24 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M24 16L32 20.5V29.5L24 34L16 29.5V20.5L24 16Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M20 24H28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M24 20V28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const LiveStateIcon: React.FC<IconProps> = (props) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M24 6C14 6 6 14 6 24C6 34 14 42 24 42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M24 12C17 12 12 17 12 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <circle cx="24" cy="24" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M28 8L30 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M36 12L33 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="36" cy="24" r="2" fill="currentColor" className="pulse-dot"/>
  </svg>
);

export const VerdictIcon: React.FC<IconProps> = (props) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M24 8V32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12 20L24 14L36 20" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M8 32L16 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M40 32L32 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M6 32H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M30 32H42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="24" cy="38" r="3" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
