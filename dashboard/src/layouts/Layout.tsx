import React from 'react';
import { Link, useLocation, useOutlet } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Users, Scale, History, Cpu, ChevronLeft, ChevronRight, Droplets, Target, Map, Landmark, Shield, GitBranch, Radio, Gavel, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import verdictLogo from '../assets/newlogo.png';
import { WalletConnectButton } from '../components/WalletConnectButton';
import { ORCHESTRATOR_URL } from '../services/api';
import '../styles/sidebar-switches.css';

const NAV_SECTIONS = [
  {
    title: 'OVERVIEW',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Agents', path: '/reputation', icon: Users },
      { name: 'History', path: '/transactions', icon: History },
    ],
  },
  {
    title: 'TOOLS',
    items: [
      { name: 'Value Asset', path: '/assess', icon: Scale },
      { name: 'Borrow', path: '/borrow', icon: Landmark },
      { name: 'Insure', path: '/insure', icon: Shield },
      { name: 'Confidence', path: '/confidence', icon: Target },
      { name: 'Oracle', path: '/oracle', icon: Radio },
      { name: 'Disputes', path: '/disputes', icon: Gavel },
    ],
  },
  {
    title: 'RESOURCES',
    items: [
      { name: 'How Verdicto Works', path: '/how-it-works', icon: Cpu },
      { name: 'Architecture', path: '/architecture', icon: GitBranch },
      { name: 'Roadmap', path: '/roadmap', icon: Map },
    ],
  },
];

export const Layout: React.FC = () => {
  const location = useLocation();
  const outlet = useOutlet();
  const [theme, setTheme] = React.useState(() => {
    return localStorage.getItem('verdicto-theme') || 'light';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [networkOnline, setNetworkOnline] = React.useState<boolean | null>(null);
  const networkRef = React.useRef<boolean | null>(null);

  // Network status polling — only update state when value actually changes
  React.useEffect(() => {
    const checkNetwork = async () => {
      try {
        const res = await fetch(`${ORCHESTRATOR_URL}/api/contract-state`, {
          method: 'GET',
          signal: AbortSignal.timeout(8000),
        });
        const online = res.ok;
        if (networkRef.current !== online) {
          networkRef.current = online;
          setNetworkOnline(online);
        }
      } catch {
        if (networkRef.current !== false) {
          networkRef.current = false;
          setNetworkOnline(false);
        }
      }
    };
    checkNetwork();
    const interval = setInterval(checkNetwork, 30_000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('verdicto-theme', theme);
  }, [theme]);

  // Reset scroll position on route change
  React.useEffect(() => {
    window.scrollTo(0, 0);
    const mainEl = document.querySelector('.main-content-area');
    if (mainEl) mainEl.scrollTop = 0;
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar" data-collapsed={sidebarCollapsed}>
        {/* Logo */}
        <div className="sidebar-header">
          {!sidebarCollapsed && (
            <Link to="/" className="sidebar-logo">
              <img src={verdictLogo} alt="Verdicto" className="logo-img logo-img--lg" />
              <span className="sidebar-logo-text">Verdicto</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/" className="sidebar-logo sidebar-logo--collapsed" title="Verdicto">
              <img src={verdictLogo} alt="Verdicto" className="logo-img logo-img--lg" />
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="sidebar-section">
              {!sidebarCollapsed && section.title && (
                <div className="sidebar-section-title">{section.title}</div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`sidebar-link ${active ? 'active' : ''} ${sidebarCollapsed ? 'sidebar-link--collapsed' : ''}`}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    <Icon size={sidebarCollapsed ? 20 : 18} />
                    {!sidebarCollapsed && <span>{item.name}</span>}
                    {active && <div className="sidebar-active-indicator" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="sidebar-footer">
          {/* Get Testnet Tokens link */}
          {!sidebarCollapsed && (
            <div className="sidebar-footer-section">
              <a
                href="https://testnet.cspr.live/tools/faucet"
                target="_blank"
                rel="noopener noreferrer"
                className="faucet-link sidebar-faucet-link"
              >
                <Droplets size={14} />
                <span>Get Testnet Tokens</span>
              </a>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="sidebar-footer-section--collapsed">
              <a
                href="https://testnet.cspr.live/tools/faucet"
                target="_blank"
                rel="noopener noreferrer"
                title="Get Testnet Tokens"
                className="faucet-link"
              >
                <Droplets size={16} />
              </a>
            </div>
          )}
          {/* Wallet Connect Button */}
          {!sidebarCollapsed && (
            <div className="sidebar-footer-section">
              <WalletConnectButton />
            </div>
          )}
          {sidebarCollapsed && (
            <div className="sidebar-footer-section--collapsed">
              <WalletConnectButton collapsed />
            </div>
          )}
          <div className="sidebar-theme-toggle">
            {/* Theme Toggle — Sun/Moon switch */}
            <label className="theme-switch" title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
              <input
                type="checkbox"
                checked={theme === 'dark'}
                onChange={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              />
              <span className="slider">
                <span className="sun">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                </span>
                <span className="moon">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                </span>
              </span>
            </label>

            {/* Network Status — Plane switch (auto, not interactive) */}
            <div className="sidebar-switch-row">
              <div className="network-switch">
                <input type="checkbox" checked={networkOnline === true} readOnly tabIndex={-1} />
                <div className="network-switch-track">
                  <span className="street-middle" />
                  <span className="cloud" />
                  <span className="cloud two" />
                  <div className="knob">
                    {networkOnline === true
                      ? <Wifi size={11} />
                      : <WifiOff size={11} />
                    }
                  </div>
                </div>
              </div>
              <span className="sidebar-switch-tooltip">
                {networkOnline === null ? 'Checking…' : networkOnline ? 'Network Online' : 'Network Offline'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Edge collapse/expand handle — positioned on sidebar right border */}
      <button
        className={`sidebar-edge-handle ${sidebarCollapsed ? 'sidebar-edge-handle--collapsed' : ''}`}
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? (
          <ChevronRight size={14} />
        ) : (
          <ChevronLeft size={14} />
        )}
      </button>

      {/* Mobile Header */}
      <header className="mobile-header">
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <Link to="/" className="sidebar-logo">
          <img src={verdictLogo} alt="Verdicto" className="logo-img logo-img--md" />
          <span className="sidebar-logo-text">Verdicto</span>
        </Link>
        <div className="flex items-center gap-2">
          <WalletConnectButton />
          <label className="theme-switch" title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
            <input
              type="checkbox"
              checked={theme === 'dark'}
              onChange={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            />
            <span className="slider">
              <span className="sun">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              </span>
              <span className="moon">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
              </span>
            </span>
          </label>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mobile-menu-overlay"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="mobile-menu-content"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {NAV_SECTIONS.map((section) => (
                  <div key={section.title || section.items[0].path}>
                  {section.title && <div className="sidebar-section-title mobile-section-title">{section.title}</div>}
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`mobile-menu-link ${active ? 'active' : ''}`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon size={18} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="main-content-area">
        <div className="page-layout">
          <AnimatePresence mode="wait">
            {outlet && React.cloneElement(outlet as React.ReactElement, { key: location.pathname })}
          </AnimatePresence>
        </div>
      </main>



      {/* Enterprise Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <Link to="/dashboard" className={`bottom-nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>
        <Link to="/assess" className={`bottom-nav-item ${isActive('/assess') ? 'active' : ''}`}>
          <Scale size={20} />
          <span>Value</span>
        </Link>
        <Link to="/borrow" className={`bottom-nav-item ${isActive('/borrow') ? 'active' : ''}`}>
          <Landmark size={20} />
          <span>Borrow</span>
        </Link>
        <Link to="/disputes" className={`bottom-nav-item ${isActive('/disputes') ? 'active' : ''}`}>
          <Gavel size={20} />
          <span>Disputes</span>
        </Link>
        <button 
          className={`bottom-nav-item ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu size={20} />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
};
