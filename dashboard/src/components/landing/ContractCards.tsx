import React from 'react';
import { motion } from 'motion/react';
import { IconMicropayment } from './VerdictoIcons';

const CONTRACTS = [
  {
    name: 'VerdictOracle',
    hash: 'pending' as const,
    description: 'Stores multi-agent consensus valuations on-chain. Every verdict includes HMAC receipt chains and ZK-Lite commitments.',
  },
  {
    name: 'VotingContract',
    hash: 'f00cbb8f03e468c0750e7ce78bfc7f8a5c337fd520ebc218e969833bdea0fcfb' as const,
    description: 'Records reputation-weighted votes from juror agents. Each juror signs HMAC receipts for every deliberation round.',
  },
  {
    name: 'ReputationRegistry',
    hash: '30da84e6d0db566b5d8ba4a93cc392bd2268bff6c24c1c0e5cb16a4f51038942' as const,
    description: 'Maintains identity and reliability scores for every AI agent. Uses retroactive settlement — reputation updates when market reality is known.',
  },
  {
    name: 'EscrowContract',
    hash: '83bf2bab33200e60b092847abc38ea5d0301327fae43fc2d3555fec5be120d3a' as const,
    description: 'Locks CSPR during dispute resolution and releases on verdict. Handles collateral for Borrow and claim payouts for Insure.',
  },
];

const FEES = [
  { product: 'Assessment', amount: '2.5 CSPR' },
  { product: 'Confidence', amount: '1 CSPR' },
  { product: 'Loan', amount: '5 CSPR' },
  { product: 'Insurance', amount: '3 CSPR' },
  { product: 'Dispute', amount: '5 CSPR' },
];

export const ContractCards: React.FC = () => {
  return (
    <section className="rb-section rb-protocol">
      <div className="rb-inner">
        <div style={{ marginBottom: 48 }}>
          <div className="rb-tag">Infrastructure &amp; Payments</div>
          <h2 className="rb-title">X402 Protocol &amp; Deployed Contracts</h2>
          <p className="rb-subtitle">
            Every action is gated by a wallet-signed micropayment. Four smart contracts on Casper Testnet
            handle verdicts, voting, reputation, and escrow — all publicly verifiable.
          </p>
        </div>

        <div className="rb-protocol__split">
          {/* Left: x402 explanation + fee table */}
          <motion.div
            className="rb-protocol__explainer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <IconMicropayment size={20} style={{ color: 'rgba(255,255,255,0.35)' }} />
              <h3>Pay-Per-Query Micropayments</h3>
            </div>
            <p>
              Each assessment, loan, and insurance policy is gated by a small CSPR micropayment,
              signed directly by the user's wallet. No subscriptions, no stored payment methods.
              The cryptographic proof is validated server-side before any action executes.
            </p>

            <table className="rb-fee-table">
              <tbody>
                {FEES.map((f) => (
                  <tr key={f.product}>
                    <td>{f.product}</td>
                    <td>{f.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="rb-x402-note">
              <strong>How it works:</strong> The wallet creates a native CSPR transfer deploy,
              signs it, and sends the signed deploy as a base64 payment proof. The backend
              validates the signature and amount before executing any action.
            </p>
          </motion.div>

          {/* Right: Contract list */}
          <div className="rb-contracts">
            {CONTRACTS.map((contract, i) => (
              <motion.div
                key={contract.name}
                className="rb-contract"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="rb-contract__head">
                  <div className={`rb-contract__dot${contract.hash === 'pending' ? ' rb-contract__dot--pending' : ''}`} />
                  <span className="rb-contract__name">{contract.name}</span>
                </div>
                <p className="rb-contract__desc">{contract.description}</p>
                <div className="rb-contract__hash">
                  {contract.hash === 'pending' ? (
                    <span>Deploying to Testnet</span>
                  ) : (
                    <a
                      href={`https://testnet.cspr.live/deploy/${contract.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {contract.hash.slice(0, 12)}…
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
