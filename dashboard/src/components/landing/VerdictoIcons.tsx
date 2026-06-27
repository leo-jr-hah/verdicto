import React from 'react';

/**
 * Custom geometric line icons for Verdicto.
 * Abstract, consistent stroke system — not literal clip-art.
 * All: 24×24 viewBox, stroke-width 1.5, round caps/joins, no fills.
 */

interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/* Receipt Chain — interlocking hash links */
export const IconReceiptChain: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    {/* Two interlinked rectangles with hash marks */}
    <rect x="2" y="6" width="9" height="12" rx="1" />
    <rect x="13" y="6" width="9" height="12" rx="1" />
    <line x1="5" y1="10" x2="8" y2="10" />
    <line x1="5" y1="14" x2="8" y2="14" />
    <line x1="16" y1="10" x2="19" y2="10" />
    <line x1="16" y1="14" x2="19" y2="14" />
    {/* Chain link between them */}
    <path d="M11 12 h2" strokeDasharray="1.5 1" />
  </svg>
);

/* Cryptographic Commitment — lock with hash fingerprint */
export const IconCommitment: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    {/* Shield outline */}
    <path d="M12 3 L20 7 V13 C20 17.4 16.4 21 12 22 C7.6 21 4 17.4 4 13 V7 Z" />
    {/* Hash/fingerprint inside */}
    <line x1="9" y1="10" x2="15" y2="10" />
    <line x1="9" y1="14" x2="13" y2="14" />
    <circle cx="15" cy="14" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

/* Adversarial Deliberation — two opposing vectors with intersection */
export const IconDeliberation: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    {/* Two opposing arrows crossing */}
    <path d="M4 6 L14 16" />
    <path d="M10 4 L14 6 L12 10" />
    <path d="M20 18 L10 8" />
    <path d="M14 20 L10 18 L12 14" />
    {/* Intersection point */}
    <circle cx="12" cy="12" r="2" />
  </svg>
);

/* Micropayment — coin with transfer arrow */
export const IconMicropayment: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    {/* Circle (coin) */}
    <circle cx="10" cy="12" r="7" />
    {/* Value mark */}
    <path d="M10 8 V16" />
    <path d="M8 10 H11.5 C12.3 10 13 10.7 13 11.5 C13 12.3 12.3 13 11.5 13 H8" />
    {/* Transfer arrow */}
    <path d="M17 8 L21 12 L17 16" />
    <line x1="19" y1="12" x2="15" y2="12" />
  </svg>
);

/* Verification checkmark — geometric, not generic */
export const IconVerify: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 12 L10.5 15.5 L17 9" />
  </svg>
);
