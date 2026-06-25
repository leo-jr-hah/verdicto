import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Moon, Sun, Menu, X, Bot, LayoutDashboard, Users, Scale, History, Cpu, ChevronRight, Droplets, Target, Map, Landmark, Shield, GitBranch, Radio, Gavel } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import verdictLogo from '../assets/logo.jpeg';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { WalletConnectButton } from '../components/WalletConnectButton';
import { InteractiveStory } from '../components/story/InteractiveStory';
import { DemoModeBanner } from '../components/DemoModeBanner';

const NAV_SECTIONS = [
  {
    title: 'OVERVIEW',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
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
    title: 'DATA',
    items: [
      { name: 'Agents', path: '/reputation', icon: Users },
      { name: 'History', path: '/transactions', icon: History },
      { name: 'How Verdicto Works', path: '/how-it-works', icon: Cpu },
      { name: 'Architecture', path: '/architecture', icon: GitBranch },
      { name: 'Roadmap', path: '/roadmap', icon: Map },
    ],
  },
];

export const Layout: React.FC = () => {
  const location = useLocation();
  const [theme, setTheme] = React.useState('light');
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isStoryOpen, setIsStoryOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar" data-collapsed={sidebarCollapsed}>
        {/* Logo */}
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            <img src={verdictLogo} alt="Verdicto" className="logo-img logo-img--lg" />
            <span className="sidebar-logo-text">Verdicto</span>
          </Link>
          <button
            className="sidebar-collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label="Toggle sidebar"
          >
            <ChevronRight
              size={16}
              className={`sidebar-collapse-icon ${sidebarCollapsed ? 'sidebar-collapse-icon--collapsed' : 'sidebar-collapse-icon--expanded'}`}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="sidebar-section">
              {!sidebarCollapsed && (
                <div className="sidebar-section-title">{section.title}</div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`sidebar-link ${active ? 'active' : ''}`}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    <Icon size={18} />
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
              <WalletConnectButton />
            </div>
          )}
          <div className="sidebar-theme-toggle">
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="sidebar-icon-btn"
              title={theme === 'light' ? 'Dark mode' : 'Light mode'}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            {!sidebarCollapsed && <ConnectionStatus />}
          </div>
        </div>
      </aside>

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
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="sidebar-icon-btn"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
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
              onClick={(e) => e.stopPropagation()}
            >
              {NAV_SECTIONS.map((section) => (
                <div key={section.title}>
                  <div className="sidebar-section-title mobile-section-title">{section.title}</div>
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
        <DemoModeBanner />
        <div className="page-layout">
          <Outlet />
        </div>
      </main>

      {/* Floating Action Button for Story */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, type: 'spring' }}
        onClick={() => setIsStoryOpen(true)}
        className="story-fab"
      >
        <Bot size={22} />
      </motion.button>

      {/* Interactive Story Modal Overlay */}
      <InteractiveStory isOpen={isStoryOpen} onClose={() => setIsStoryOpen(false)} />
    </div>
  );
};
