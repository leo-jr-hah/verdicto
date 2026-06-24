#![cfg_attr(not(test), no_std)]
#![cfg_attr(not(test), no_main)]
extern crate alloc;

use odra::prelude::*;

// ─── Errors ──────────────────────────────────────────────────────────────────

#[odra::odra_error]
pub enum OracleError {
    NotAdmin = 0,
    VerdictNotFound = 1,
    Expired = 2,
    InvalidConfidence = 3,
}

// ─── Data Structures ─────────────────────────────────────────────────────────

/// A single verdict stored on-chain by the oracle.
/// Represents a multi-agent consensus valuation for an asset.
#[odra::odra_type]
pub struct Verdict {
    /// Unique asset identifier (e.g. "ASSESS-1719000000000")
    pub asset_id: String,
    /// Consensus value in motes (smallest CSPR unit) or USD cents
    pub value: u64,
    /// Confidence score 0-100 (weighted average of juror confidences)
    pub confidence: u8,
    /// Number of jurors that participated
    pub juror_count: u8,
    /// HMAC receipt chain hash for off-chain verification
    pub receipt_hash: String,
    /// Unix timestamp when verdict was produced
    pub timestamp: u64,
    /// Unix timestamp when verdict expires (typically +24h)
    pub expiry: u64,
    /// Agent weights as comma-separated "agent_id:score" pairs
    /// e.g. "evidence:891,market:778,precedent:856"
    pub agent_weights: String,
    /// The deliberation decision (e.g. "AgentAPreferred", "SplitFifty", "AgentBPreferred")
    pub decision: String,
}

// ─── Events ──────────────────────────────────────────────────────────────────

#[odra::event]
pub struct VerdictStored {
    pub asset_id: String,
    pub value: u64,
    pub confidence: u8,
    pub timestamp: u64,
    pub expiry: u64,
}

#[odra::event]
pub struct VerdictQueried {
    pub asset_id: String,
    pub caller: Address,
}

// ─── Contract ────────────────────────────────────────────────────────────────

#[odra::module]
pub struct VerdictOracle {
    /// asset_id → Verdict
    verdicts: Mapping<String, Verdict>,
    /// Total number of verdicts stored
    verdict_count: Var<u32>,
    /// Admin address (deployer)
    admin: Var<Address>,
    /// Default TTL in seconds (86400 = 24 hours)
    default_ttl: Var<u64>,
}

#[odra::module]
impl VerdictOracle {
    pub fn init(&mut self) {
        self.admin.set(self.env().caller());
        self.verdict_count.set(0);
        self.default_ttl.set(86_400); // 24 hours
    }

    // ─── Write Methods (admin only) ─────────────────────────────────────────

    /// Store a new verdict on-chain. Called by the orchestrator after
    /// multi-agent deliberation produces a consensus.
    pub fn store_verdict(
        &mut self,
        asset_id: String,
        value: u64,
        confidence: u8,
        juror_count: u8,
        receipt_hash: String,
        agent_weights: String,
        decision: String,
    ) {
        self.assert_admin();

        if confidence > 100 {
            self.env().revert(OracleError::InvalidConfidence);
        }

        let now = self.env().get_block_time();
        let ttl = self.default_ttl.get_or_default();

        let verdict = Verdict {
            asset_id: asset_id.clone(),
            value,
            confidence,
            juror_count,
            receipt_hash,
            timestamp: now,
            expiry: now + ttl,
            agent_weights,
            decision,
        };

        self.verdicts.set(&asset_id, verdict);

        // Increment count (or set to 1 if first)
        let count = self.verdict_count.get_or_default();
        self.verdict_count.set(count + 1);

        self.env().emit_event(VerdictStored {
            asset_id,
            value,
            confidence,
            timestamp: now,
            expiry: now + ttl,
        });
    }

    /// Update the default TTL for new verdicts.
    pub fn set_default_ttl(&mut self, ttl_seconds: u64) {
        self.assert_admin();
        self.default_ttl.set(ttl_seconds);
    }

    // ─── Read Methods (public, free) ────────────────────────────────────────

    /// Get the latest verdict for an asset. Returns the full Verdict struct.
    /// Any contract or off-chain client can call this.
    pub fn get_verdict(&self, asset_id: String) -> Verdict {
        let verdict = self.verdicts
            .get(&asset_id)
            .unwrap_or_revert_with(&self.env(), OracleError::VerdictNotFound);

        self.env().emit_event(VerdictQueried {
            asset_id,
            caller: self.env().caller(),
        });

        verdict
    }

    /// Get the age of a verdict in seconds (0 if not found).
    pub fn get_verdict_age(&self, asset_id: String) -> u64 {
        match self.verdicts.get(&asset_id) {
            Some(verdict) => {
                let now = self.env().get_block_time();
                if now > verdict.timestamp { now - verdict.timestamp } else { 0 }
            }
            None => 0,
        }
    }

    /// Check if a verdict has expired (older than its TTL).
    /// Returns true if expired OR not found.
    pub fn is_expired(&self, asset_id: String) -> bool {
        match self.verdicts.get(&asset_id) {
            Some(verdict) => self.env().get_block_time() > verdict.expiry,
            None => true,
        }
    }

    /// Check if a verdict is still fresh (not expired).
    /// Returns false if expired OR not found.
    pub fn is_fresh(&self, asset_id: String) -> bool {
        match self.verdicts.get(&asset_id) {
            Some(verdict) => self.env().get_block_time() <= verdict.expiry,
            None => false,
        }
    }

    /// Get the total number of verdicts stored.
    pub fn total_verdicts(&self) -> u32 {
        self.verdict_count.get_or_default()
    }

    /// Get the current default TTL.
    pub fn get_default_ttl(&self) -> u64 {
        self.default_ttl.get_or_default()
    }
}
