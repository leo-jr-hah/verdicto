import React from 'react';
import newLogo from '../assets/newlogo.png';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', width = 48, height = 48 }) => {
  return (
    <img 
      src={newLogo} 
      alt="Logo" 
      width={width} 
      height={height} 
      className={className} 
    />
  );
};
