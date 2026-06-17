import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Moon, Sun, Menu, X, Bot, LayoutDashboard, PlayCircle, Users, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '../components/Logo';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { InteractiveStory } from '../components/story/InteractiveStory';

export const Layout: React.FC = () => {
  const location = useLocation();
  const [theme, setTheme] = React.useState('light');
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isStoryOpen, setIsStoryOpen] = React.useState(false);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Live Session', path: '/deliberation' },
    { name: 'Network', path: '/reputation' },
    { name: 'Activity', path: '/transactions' },
    { name: 'How It Works', path: '/architecture' },
  ];

  const isActive = (path: string) => location.pathname === path;

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

          <nav className="desktop-nav" style={{ display: 'flex', gap: '2rem' }}>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

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

            <ConnectionStatus />
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mobile-menu-overlay"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`mobile-menu-link ${isActive(link.path) ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Floating Action Button for Story */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, ...(location.pathname === '/' ? { y: 0 } : { y: '-50%' }) }}
        transition={{ delay: 1, type: 'spring' }}
        onClick={() => setIsStoryOpen(true)}
        className="story-fab"
        style={location.pathname === '/' ? {
          position: 'fixed',
          bottom: '100px', // Above mobile tab bar
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'var(--primary)',
          color: 'var(--bg-main)',
          border: 'none',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 20px rgba(16, 185, 129, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 50
        } : {
          position: 'fixed',
          top: '50%',
          right: '0',
          transform: 'translateY(-50%)',
          width: '45px',
          height: '90px',
          borderRadius: '45px 0 0 45px',
          background: 'var(--primary)',
          color: 'var(--bg-main)',
          border: 'none',
          borderRight: 'none',
          boxShadow: '-5px 0 15px rgba(0, 0, 0, 0.3), 0 0 15px rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 50
        }}
      >
        <Bot size={28} />
      </motion.button>

      {/* Interactive Story Modal Overlay */}
      <InteractiveStory isOpen={isStoryOpen} onClose={() => setIsStoryOpen(false)} />

      {/* Enterprise Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-surface)',
        padding: '4rem 0'
      }}>
        <div className="container">
          <div className="footer-grid" style={{
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
                <li><Link to="/architecture" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}>Architecture</Link></li>
                <li><a href="https://github.com/casper-network" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}>GitHub</a></li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>Network</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <li><a href="https://testnet.cspr.live" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}>Casper Explorer</a></li>
                <li><Link to="/transactions" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}>Transactions</Link></li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>Project</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <li><Link to="/deliberation" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}>Live Demo</Link></li>
                <li><Link to="/reputation" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}>Agent Network</Link></li>
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
      {/* Mobile Bottom Tab Bar */}
      <nav className="mobile-tab-bar">
        {[
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Live Session', path: '/deliberation', icon: PlayCircle },
          { name: 'Network', path: '/reputation', icon: Users },
          { name: 'Activity', path: '/transactions', icon: Activity }
        ].map((tab) => {
          const active = isActive(tab.path);
          return (
            <Link
              key={tab.name}
              to={tab.path}
              className={`mobile-tab-item ${active ? 'active' : ''}`}
            >
              <tab.icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
