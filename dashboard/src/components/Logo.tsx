import React from 'react';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', width = 48, height = 48 }) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Shield Background / Border */}
      <path 
        d="M50 15L25 22.5V45C25 65 35 80 50 87.5C65 80 75 65 75 45V22.5L50 15Z" 
        stroke="#FF3B3B" 
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Checkmark */}
      <path 
        d="M38 52L46 60L65 40" 
        stroke="#FF3B3B" 
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
};
