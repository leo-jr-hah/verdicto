import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'motion/react';
import verdictLogo from '../../assets/newlogo.png';

const XIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const GitHubIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const Footer: React.FC = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.footer
      ref={ref}
      className="rb-footer"
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.6 }}
    >
      <div className="rb-footer__inner">
        <div className="rb-footer__grid">
          {/* Brand */}
          <div>
            <div className="rb-footer__brand-name">
              <img src={verdictLogo} alt="Verdicto" />
              Verdicto
            </div>
            <p className="rb-footer__brand-desc">
              AI-powered RWA oracle on Casper blockchain. Multi-agent valuations,
              cryptographic receipts, on-chain settlement.
            </p>
          </div>

          {/* Product */}
          <div>
            <div className="rb-footer__col-title">Product</div>
            <div className="rb-footer__links">
              <Link to="/assess" className="rb-footer__link">Value Asset</Link>
              <Link to="/oracle" className="rb-footer__link">Oracle</Link>
              <Link to="/borrow" className="rb-footer__link">Borrow</Link>
              <Link to="/insure" className="rb-footer__link">Insure</Link>
              <Link to="/confidence" className="rb-footer__link">Confidence</Link>
            </div>
          </div>

          {/* Resources */}
          <div>
            <div className="rb-footer__col-title">Resources</div>
            <div className="rb-footer__links">
              <Link to="/architecture" className="rb-footer__link">Architecture</Link>
              <Link to="/roadmap" className="rb-footer__link">Roadmap</Link>
              <a href="https://docs.casper.network" target="_blank" rel="noopener noreferrer" className="rb-footer__link">Casper Docs</a>
              <a href="https://testnet.cspr.live" target="_blank" rel="noopener noreferrer" className="rb-footer__link">Block Explorer</a>
            </div>
          </div>

          {/* Network */}
          <div>
            <div className="rb-footer__col-title">Network</div>
            <div className="rb-footer__links">
              <span className="rb-footer__link" style={{ cursor: 'default' }}>Casper Testnet</span>
              <span className="rb-footer__link" style={{ cursor: 'default' }}>4 Smart Contracts</span>
              <span className="rb-footer__link" style={{ cursor: 'default' }}>x402 Micropayments</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="rb-footer__bottom">
          <span className="rb-footer__copy">
            {new Date().getFullYear()} Verdicto. Cryptographically verifiable.
          </span>
          <div className="rb-footer__socials">
            <a href="https://x.com/Verdictoxyz" target="_blank" rel="noopener noreferrer" className="rb-footer__social" aria-label="Follow on X">
              <XIcon size={14} />
            </a>
            <a href="https://github.com/leo-jr-hah/verdicto" target="_blank" rel="noopener noreferrer" className="rb-footer__social" aria-label="View on GitHub">
              <GitHubIcon size={14} />
            </a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};
