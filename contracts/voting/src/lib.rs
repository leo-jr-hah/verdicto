#![cfg_attr(not(test), no_std)]
#![cfg_attr(not(test), no_main)]
extern crate alloc;

use odra::prelude::*;

#[odra::odra_error]
pub enum VotingError {
    NotAdmin = 0,
    NoVotes = 1,
    AlreadyFinalized = 2,
}

#[odra::odra_type]
pub enum VerdictOption {
    FullRefund,
    SplitFifty,
    FullRelease,
}

#[odra::odra_type]
pub struct VoteRecord {
    pub juror: Address,
    pub verdict: VerdictOption,
    pub reasoning: String,
    pub weight: u32,
}

#[odra::event]
pub struct VoteCast {
    pub dispute_id: u64,
    pub juror: Address,
    pub verdict_index: u32,
    pub weight: u32,
}

#[odra::event]
pub struct VerdictReached {
    pub dispute_id: u64,
    pub verdict: u32,
    pub total_weight: u32,
    pub winning_weight: u32,
}

#[odra::module]
pub struct VotingContract {
    jurors: Mapping<u64, Vec<Address>>,
    verdicts: Mapping<u64, u32>,
    tally: Mapping<u64, Vec<u32>>,
    vote_counts: Mapping<u64, u32>,
    required_votes: Var<u32>,
    admin: Var<Address>,
}

#[odra::module]
impl VotingContract {
    pub fn init(&mut self) {
        self.admin.set(self.env().caller());
        self.required_votes.set(3);
    }

    pub fn assign_jurors(&mut self, dispute_id: u64, juror_list: Vec<Address>) {
        self.assert_admin();
        self.jurors.set(&dispute_id, juror_list);
        self.tally.set(&dispute_id, vec![0u32, 0u32, 0u32]);
        self.vote_counts.set(&dispute_id, 0);
        self.verdicts.set(&dispute_id, 255u32); // 255 = pending
    }

    pub fn cast_vote(&mut self, dispute_id: u64, verdict: VerdictOption, _reasoning: String, weight: u32) {
        let caller = self.env().caller();

        let v_idx = match &verdict {
            VerdictOption::FullRefund => 0u32,
            VerdictOption::SplitFifty => 1u32,
            VerdictOption::FullRelease => 2u32,
        };

        let mut scores = self.tally.get(&dispute_id).unwrap_or(vec![0u32, 0u32, 0u32]);
        scores[v_idx as usize] += weight;
        self.tally.set(&dispute_id, scores.clone());

        let count = self.vote_counts.get(&dispute_id).unwrap_or(0) + 1;
        self.vote_counts.set(&dispute_id, count);

        self.env().emit_event(VoteCast {
            dispute_id,
            juror: caller,
            verdict_index: v_idx,
            weight,
        });

        if count >= self.required_votes.get_or_default() {
            self.finalize_verdict(dispute_id, &scores);
        }
    }

    pub fn get_verdict(&self, dispute_id: u64) -> u32 {
        self.verdicts.get(&dispute_id).unwrap_or(255)
    }

    pub fn get_vote_count(&self, dispute_id: u64) -> u32 {
        self.vote_counts.get(&dispute_id).unwrap_or(0)
    }

    pub fn get_tally(&self, dispute_id: u64) -> Vec<u32> {
        self.tally.get(&dispute_id).unwrap_or(vec![0u32, 0u32, 0u32])
    }

    fn assert_admin(&self) {
        let caller = self.env().caller();
        let admin = self.admin.get().unwrap_or_revert_with(&self.env(), VotingError::NotAdmin);
        if caller != admin {
            self.env().revert(VotingError::NotAdmin);
        }
    }

    fn finalize_verdict(&mut self, dispute_id: u64, scores: &[u32]) {
        let (refund, split, release) = (scores[0], scores[1], scores[2]);
        let total = refund + split + release;

        let (winner, winning_weight) = if refund >= split && refund >= release {
            (0u32, refund)
        } else if split >= refund && split >= release {
            (1u32, split)
        } else {
            (2u32, release)
        };

        self.verdicts.set(&dispute_id, winner);

        self.env().emit_event(VerdictReached {
            dispute_id,
            verdict: winner,
            total_weight: total,
            winning_weight,
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::{Deployer, NoArgs};

    #[test]
    fn test_assign_and_vote() {
        let env = odra_test::env();
        let mut contract = VotingContract::deploy(&env, NoArgs);

        let (j1, j2, j3) = (env.get_account(1), env.get_account(2), env.get_account(3));
        contract.assign_jurors(1, vec![j1, j2, j3]);

        env.set_caller(j1);
        contract.cast_vote(1, VerdictOption::SplitFifty, "".to_string(), 700);

        env.set_caller(j2);
        contract.cast_vote(1, VerdictOption::SplitFifty, "".to_string(), 650);

        env.set_caller(j3);
        contract.cast_vote(1, VerdictOption::FullRefund, "".to_string(), 500);

        assert_eq!(contract.get_verdict(1), 1);
    }

    #[test]
    fn test_unanimous_verdict() {
        let env = odra_test::env();
        let mut contract = VotingContract::deploy(&env, NoArgs);

        let (j1, j2, j3) = (env.get_account(1), env.get_account(2), env.get_account(3));
        contract.assign_jurors(1, vec![j1, j2, j3]);

        env.set_caller(j1);
        contract.cast_vote(1, VerdictOption::FullRefund, "".to_string(), 800);
        env.set_caller(j2);
        contract.cast_vote(1, VerdictOption::FullRefund, "".to_string(), 750);
        env.set_caller(j3);
        contract.cast_vote(1, VerdictOption::FullRefund, "".to_string(), 700);

        assert_eq!(contract.get_verdict(1), 0);
    }

    #[test]
    fn test_verdict_pending_before_all_votes() {
        let env = odra_test::env();
        let mut contract = VotingContract::deploy(&env, NoArgs);

        let (j1, j2, j3) = (env.get_account(1), env.get_account(2), env.get_account(3));
        contract.assign_jurors(1, vec![j1, j2, j3]);

        env.set_caller(j1);
        contract.cast_vote(1, VerdictOption::SplitFifty, "".to_string(), 700);
        env.set_caller(j2);
        contract.cast_vote(1, VerdictOption::SplitFifty, "".to_string(), 650);

        assert_eq!(contract.get_verdict(1), 255);
    }
}

#[odra::module]
pub struct CollusionResistance {
    honesty_deposits: Mapping<Address, u64>,
    whistleblower_rewards: Mapping<Address, u64>,
    slashed_agents: Mapping<Address, bool>,
}

#[odra::module]
impl CollusionResistance {
    pub fn deposit_honesty(&mut self) {
        let caller = self.env().caller();
        let amount: u64 = self.env().attached_value().as_u64();
        let current = self.honesty_deposits.get(&caller).unwrap_or_default();
        self.honesty_deposits.set(&caller, current + amount);
    }

    pub fn report_collusion(&mut self, reporter: Address, colluders: Vec<Address>, evidence: String) {
        let is_valid = self.verify_collusion_evidence(&evidence);
        
        if is_valid {
            for colluder in colluders {
                let deposit = self.honesty_deposits.get(&colluder).unwrap_or_default();
                self.honesty_deposits.set(&colluder, 0);
                self.slashed_agents.set(&colluder, true);
                
                let current_reward = self.whistleblower_rewards.get(&reporter).unwrap_or_default();
                self.whistleblower_rewards.set(&reporter, current_reward + deposit / 2);
            }
        }
    }

    fn verify_collusion_evidence(&self, evidence: &String) -> bool {
        // Simplified verification. In prod: ZK proof verification.
        evidence.contains("collusion_proof_valid")
    }
}

