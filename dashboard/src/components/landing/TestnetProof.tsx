import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Reveal } from './UIComponents';
import { fetchContractState, type ContractState } from '../../services/api';

export const TestnetProof: React.FC = () => {
  const [state, setState] = useState<ContractState | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchContractState();
      setState(data);
      setLastRefresh(new Date().toLocaleTimeString());
      setLoading(false);
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const assessments = state?.assessments?.total ?? 0;
  const csprCollected = state?.payments?.totalCollected
    ? (state.payments.totalCollected / 1e8).toFixed(1)
    : '0';
  const receipts = state?.receipts?.total ?? 0;

  return (
    <section className="testnet-section">
      <div className="testnet-layout">
        {/* Left Side: Text */}
        <div className="testnet-text">
          <Reveal direction="left" duration={0.7}>
            <div className="landing-badge landing-badge--green">
              Testnet Deployment
            </div>
            <h2 className="landing-section__title" style={{ textAlign: 'left', marginBottom: '20px' }}>
              Deployed on<br/>Casper Testnet.
            </h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '32px' }}>
              All smart contracts are live. Assessments have been submitted, analyzed, and recorded. Every deploy hash is verifiable on the public explorer.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link to="/dashboard" className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: '10px' }}>
                View Live Dashboard
              </Link>
              <Link to="/architecture" className="btn" style={{ padding: '12px 24px', borderRadius: '10px', background: 'var(--bg-elevated)' }}>
                Read the Architecture
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Right Side: Terminal Panel */}
        <div className="testnet-terminal-wrap">
          <Reveal direction="right" delay={0.3} duration={0.7}>
            <div className="card testnet-terminal">
              {/* Terminal Header */}
              <div className="testnet-terminal__header">
                <div className="testnet-terminal__dots">
                  <div className="testnet-terminal__dot" style={{ background: 'var(--text-tertiary)' }} />
                  <div className="testnet-terminal__dot" style={{ background: 'var(--text-tertiary)' }} />
                  <div className="testnet-terminal__dot" style={{ background: 'var(--text-tertiary)' }} />
                </div>
                <div className="testnet-terminal__label">cspr-testnet</div>
              </div>

              {/* Terminal Body */}
              <div className="testnet-terminal__body">
                <div className="testnet-terminal__row">
                  <span>STATUS</span>
                  <span className="testnet-terminal__row--status">{loading ? 'CONNECTING...' : 'SYNCED'}</span>
                </div>
                <div className="testnet-terminal__row">
                  <span>ASSESSMENTS RUN</span>
                  <span style={{ color: 'var(--text-primary)' }}>{loading ? '...' : assessments.toLocaleString()}</span>
                </div>
                <div className="testnet-terminal__row">
                  <span>RECEIPTS CHAINED</span>
                  <span style={{ color: 'var(--text-primary)' }}>{loading ? '...' : receipts.toLocaleString()}</span>
                </div>
                <div className="testnet-terminal__row" style={{ marginBottom: '24px' }}>
                  <span>CSPR COLLECTED</span>
                  <span style={{ color: 'var(--text-primary)' }}>{loading ? '...' : `${csprCollected} CSPR`}</span>
                </div>

                <div className="testnet-terminal__divider">
                  <div className="testnet-terminal__refresh">
                    LAST REFRESH: {lastRefresh}
                  </div>
                  <div className="testnet-terminal__polling">
                    <motion.div
                      className="testnet-terminal__cursor"
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    {loading ? 'connecting to contract state...' : 'polling contract state...'}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
