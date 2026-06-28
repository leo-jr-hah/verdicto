import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/hero-button.css';

const LETTERS = [
  { base: 'E', hover: 'V', dir: 1 },
  { base: 'X', hover: 'E', dir: -1 },
  { base: 'P', hover: 'R', dir: 1 },
  { base: 'L', hover: 'D', dir: -1 },
  { base: 'O', hover: 'I', dir: 1 },
  { base: 'R', hover: 'C', dir: -1 },
  { base: 'E', hover: 'T', dir: 1 },
];

export const HeroButton: React.FC = () => {
  return (
    <Link to="/oracle" className="uiverse">
      <div className="wrapper">
        {/* Animated Background Circles */}
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
        <div className="circle circle-4"></div>
        <div className="circle circle-5"></div>
        <div className="circle circle-6"></div>
        <div className="circle circle-7"></div>
        <div className="circle circle-8"></div>
        <div className="circle circle-9"></div>
        <div className="circle circle-10"></div>
        <div className="circle circle-11"></div>
        <div className="circle circle-12"></div>
        
        {/* Text Container with Flip Animation */}
        <div className="explore-btn-text">
          {LETTERS.map((l, i) => (
            <div 
              key={i} 
              className="explore-box" 
              style={{ '--dir-hover': l.dir === 1 ? '-100%' : '100%' } as React.CSSProperties}
            >
              <span className="letter-base">{l.base}</span>
              <span 
                className="letter-hover" 
                style={{ top: l.dir === 1 ? '100%' : '-100%' }}
              >
                {l.hover}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
};
