import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ChevronRight } from 'lucide-react';
import { StoryExplainer } from '../components/story/StoryExplainer';

export const LandingPage: React.FC = () => {

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Hero Section */}
      <section className="container landing-hero-section" style={{ paddingTop: '8rem', paddingBottom: '6rem', textAlign: 'center' }}>
        <h1 className="landing-hero-title" style={{ 
          fontSize: '4.5rem', 
          maxWidth: '1000px', 
          margin: '0 auto', 
          lineHeight: 1.1, 
          marginBottom: '1.5rem', 
          letterSpacing: '-0.03em'
        }}>
          When two parties can't agree on what an asset is worth, Verdict settles it.
        </h1>
        <p className="landing-hero-subtitle" style={{ 
          fontSize: '1.25rem', 
          color: 'var(--text-secondary)', 
          maxWidth: '750px', 
          margin: '0 auto 3rem', 
          lineHeight: 1.6
        }}>
          Transparently, fairly, and with a permanent record in 60 seconds.
        </p>
        <div className="landing-hero-buttons" style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'center'
        }}>
          <button 
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            className="btn-primary landing-hero-btn" 
            style={{ 
              padding: '1rem 2rem', 
              fontSize: '1.1rem'
            }}
          >
            See How It Works
          </button>
          <Link 
            to="/deliberation" 
            className="btn-secondary landing-hero-btn" 
            style={{ 
              padding: '1rem 2rem', 
              fontSize: '1.1rem'
            }}
          >
            Watch a Case
          </Link>
        </div>
      </section>

      {/* How It Works - Interactive Story */}
      <section id="how-it-works" style={{ borderTop: '1px solid var(--border-color)' }}>
        <StoryExplainer />
      </section>

      {/* Security Narrative Section */}
      <section className="container landing-security-section" style={{ padding: '8rem 0', textAlign: 'center' }}>
        <div className="landing-security-badge" style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          background: 'rgba(255, 59, 59, 0.1)', 
          color: 'var(--primary)', 
          padding: '0.5rem 1rem', 
          borderRadius: '999px', 
          marginBottom: '2rem'
        }}>
          <Shield size={16} /> <span style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em' }}>BUILT TO BE TRUSTED</span>
        </div>
        <h2 className="landing-security-title" style={{ 
          fontSize: '3rem', 
          marginBottom: '2rem', 
          maxWidth: '800px', 
          margin: '0 auto 2rem', 
          letterSpacing: '-0.02em'
        }}>
          Verifiable, accountable, transparent intelligence.
        </h2>
        <p className="landing-security-text" style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '1.25rem', 
          maxWidth: '800px', 
          margin: '0 auto 3rem', 
          lineHeight: 1.8
        }}>
          Every case is resolved by multiple independent AI analysts, not a single algorithm. Every decision is cryptographically signed and permanently recorded. Every analyst's track record is publicly visible. This is not black-box AI.
        </p>
        <Link 
          to="/architecture" 
          className="btn-secondary landing-security-btn" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '1rem 2rem', 
            fontSize: '1.1rem'
          }}
        >
          Learn about our security model <ChevronRight size={18} />
        </Link>
      </section>

    </div>
  );
};
