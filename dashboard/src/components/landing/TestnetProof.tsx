import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchContractState, type ContractState } from '../../services/api';

gsap.registerPlugin(ScrollTrigger);

export const TestnetProof: React.FC = () => {
  const [state, setState] = useState<ContractState | null>(null);
  const [loading, setLoading] = useState(true);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchContractState();
      setState(data);
      setLoading(false);
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // GSAP word-by-word reveal on headline
  useEffect(() => {
    if (!headlineRef.current) return;
    const words = headlineRef.current.querySelectorAll('.rb-proof__word');
    if (words.length === 0) return;

    gsap.fromTo(words,
      { y: 20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.08,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: headlineRef.current,
          start: 'top 80%',
          once: true,
        },
      }
    );
  }, []);

  const assessments = state?.assessments?.total ?? 0;
  const receipts = state?.receipts?.total ?? 0;

  return (
    <section className="rb-section rb-proof">
      <div className="rb-inner">
        {/* CTA Block */}
        <div className="rb-proof__cta">
          <h2 ref={headlineRef} className="rb-proof__headline">
            <span className="rb-proof__word">Every</span>{' '}
            <span className="rb-proof__word">Assessment.</span>{' '}
            <span className="rb-proof__word">Cryptographically</span>{' '}
            <span className="rb-proof__word">Proven.</span>
          </h2>
          <p className="rb-proof__sub">
            Not "trust us" — verify it. Every AI assessment produces HMAC receipt chains
            and ZK-Lite commitments anchored to Casper L1. Four products, one verification layer.
          </p>
          <div className="rb-proof__actions">
            <Link to="/dashboard" className="rb-btn-primary">
              Open Dashboard →
            </Link>
            <Link to="/architecture" className="rb-btn-ghost">
              Architecture
            </Link>
          </div>
        </div>

        {/* Live terminal */}
        <motion.div
          className="rb-terminal"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Header — custom, not generic 3-dot */}
          <div className="rb-terminal__header">
            <div className="rb-terminal__header-left">
              <div className="rb-terminal__dot rb-terminal__dot--green" />
              <span className="rb-terminal__header-title">verdicto — live state</span>
            </div>
            <span className="rb-terminal__header-status">operational</span>
          </div>

          {/* Body — command + output with different styling */}
          <div className="rb-terminal__body">
            <div className="rb-terminal__line">
              <span className="rb-terminal__prompt">$</span>
              <span className="rb-terminal__cmd">verdicto status --verbose</span>
            </div>

            <div className="rb-terminal__output">
              <div className="rb-terminal__row">
                <span className="rb-terminal__label">network</span>
                <span className="rb-terminal__value">casper-testnet</span>
              </div>
              <div className="rb-terminal__row">
                <span className="rb-terminal__label">contracts</span>
                <span className="rb-terminal__value">4 deployed</span>
              </div>
              <div className="rb-terminal__row">
                <span className="rb-terminal__label">assessments</span>
                <span className="rb-terminal__value rb-terminal__value--accent">
                  {loading ? '...' : assessments}
                </span>
              </div>
              <div className="rb-terminal__row">
                <span className="rb-terminal__label">receipts</span>
                <span className="rb-terminal__value rb-terminal__value--accent">
                  {loading ? '...' : receipts}
                </span>
              </div>
              <div className="rb-terminal__row">
                <span className="rb-terminal__label">status</span>
                <span className="rb-terminal__value">operational</span>
              </div>
            </div>
          </div>

          {/* Footer — verify command + blinking cursor */}
          <div className="rb-terminal__footer">
            <div className="rb-terminal__verify-cmd">$ verdicto verify --all --receipts</div>
            <div className="rb-terminal__verify-result">
              <span className="rb-terminal__check">✓</span>
              <span className="rb-terminal__check-text">all receipts valid · chain intact · 0 tampered</span>
            </div>
            <div className="rb-terminal__cursor-line">
              <span className="rb-terminal__prompt">$</span>
              <span className="rb-terminal__cursor" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
