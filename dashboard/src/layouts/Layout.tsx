import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { Logo } from '../components/Logo';

export const Layout: React.FC = () => {
  const location = useLocation();
  
  const [theme, setTheme] = React.useState('light');

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const navLinks = [
    { name: 'Overview', path: '/dashboard' },
    { name: 'Cases', path: '/disputes' },
    { name: 'Live Court', path: '/deliberation' },
    { name: 'Agents', path: '/reputation' },
    { name: 'Ledger', path: '/transactions' },
    { name: 'System Map', path: '/architecture' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <header style={{ 
        borderBottom: '1px solid var(--border-color)', 
        backgroundColor: 'var(--bg-main)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div className="container" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          height: '72px' 
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Logo width={32} height={32} />
            <span style={{ 
              fontFamily: 'var(--font-display)', 
              fontWeight: 700, 
              fontSize: '1.25rem',
              letterSpacing: '-0.02em'
            }}>VERDICT</span>
          </Link>
          
          <nav style={{ display: 'flex', gap: '2rem' }}>
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path}
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: isActive(link.path) ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'color 0.2s ease',
                  borderBottom: isActive(link.path) ? '2px solid var(--primary)' : '2px solid transparent',
                  paddingBottom: '24px',
                  position: 'relative',
                  top: '12px'
                }}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <button 
               onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
               style={{
                 background: 'none',
                 border: 'none',
                 color: 'var(--text-secondary)',
                 cursor: 'pointer',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 padding: '0.5rem'
               }}
             >
               {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
             </button>
             
             <div style={{ 
               display: 'flex', 
               alignItems: 'center', 
               gap: '0.5rem', 
               padding: '0.5rem 1rem', 
               fontSize: '0.85rem',
               fontWeight: 600,
               color: 'var(--text-secondary)',
               background: 'var(--bg-surface)',
               border: '1px solid var(--border-color)',
               borderRadius: '999px'
             }}>
               <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)' }}></span>
               Casper Testnet
             </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Enterprise Footer */}
      <footer style={{ 
        borderTop: '1px solid var(--border-color)', 
        backgroundColor: 'var(--bg-surface)',
        padding: '4rem 0'
      }}>
        <div className="container">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1.5fr 1fr 1fr 1fr', 
            gap: '4rem',
            marginBottom: '4rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Logo width={24} height={24} />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>VERDICT</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Agentic Trust Infrastructure for Real World Assets.
                Autonomous agents verify, evaluate, deliberate, and certify tokenized assets natively on the Casper Network.
              </p>
            </div>
            
            <div>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>Developers</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <li><a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Documentation</a></li>
                <li><a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>GitHub</a></li>
                <li><a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Architecture</a></li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>Network</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <li><a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Smart Contracts</a></li>
                <li><a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Casper Explorer</a></li>
                <li><a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Status</a></li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>Project</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <li><a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Roadmap</a></li>
                <li><a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div style={{ 
            borderTop: '1px solid var(--border-color)', 
            paddingTop: '2rem', 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
              &copy; {new Date().getFullYear()} Verdict. Built on Casper Network.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
