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
    AgentAPreferred,
    SplitFifty,
    AgentBPreferred,
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
    pub assessment_id: u64,
    pub juror: Address,
    pub verdict_index: u32,
    pub weight: u32,
}

#[odra::event]
pub struct VerdictReached {
    pub assessment_id: u64,
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

    pub fn assign_jurors(&mut self, assessment_id: u64, juror_list: Vec<Address>) {
        self.assert_admin();
        self.jurors.set(&assessment_id, juror_list);
        self.tally.set(&assessment_id, vec![0u32, 0u32, 0u32]);
        self.vote_counts.set(&assessment_id, 0);
        self.verdicts.set(&assessment_id, 255u32); // 255 = pending
    }

    pub fn cast_vote(&mut self, assessment_id: u64, verdict: VerdictOption, _reasoning: String, weight: u32) {
        let caller = self.env().caller();

        let v_idx = match &verdict {
            VerdictOption::AgentAPreferred => 0u32,
            VerdictOption::SplitFifty => 1u32,
            VerdictOption::AgentBPreferred => 2u32,
        };

        let mut scores = self.tally.get(&assessment_id).unwrap_or(vec![0u32, 0u32, 0u32]);
        scores[v_idx as usize] += weight;
        self.tally.set(&assessment_id, scores.clone());

        let count = self.vote_counts.get(&assessment_id).unwrap_or(0) + 1;
        self.vote_counts.set(&assessment_id, count);

        self.env().emit_event(VoteCast {
            assessment_id,
            juror: caller,
            verdict_index: v_idx,
            weight,
        });

        if count >= self.required_votes.get_or_default() {
            self.finalize_verdict(assessment_id, &scores);
        }
    }

    pub fn get_verdict(&self, assessment_id: u64) -> u32 {
        self.verdicts.get(&assessment_id).unwrap_or(255)
    }

    pub fn get_vote_count(&self, assessment_id: u64) -> u32 {
        self.vote_counts.get(&assessment_id).unwrap_or(0)
    }

    pub fn get_tally(&self, assessment_id: u64) -> Vec<u32> {
        self.tally.get(&assessment_id).unwrap_or(vec![0u32, 0u32, 0u32])
    }

    fn assert_admin(&self) {
        let caller = self.env().caller();
        let admin = self.admin.get().unwrap_or_revert_with(&self.env(), VotingError::NotAdmin);
        if caller != admin {
            self.env().revert(VotingError::NotAdmin);
        }
    }

    fn finalize_verdict(&mut self, assessment_id: u64, scores: &[u32]) {
        let (agent_a, split, agent_b) = (scores[0], scores[1], scores[2]);
        let total = agent_a + split + agent_b;

        let (winner, winning_weight) = if agent_a >= split && agent_a >= agent_b {
            (0u32, agent_a)
        } else if split >= agent_a && split >= agent_b {
            (1u32, split)
        } else {
            (2u32, agent_b)
        };

        self.verdicts.set(&assessment_id, winner);

        self.env().emit_event(VerdictReached {
            assessment_id,
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
    fn test_cast_vote_and_finalize() {
        let env = odra_test::env();
        let mut contract = VotingContract::deploy(&env, NoArgs);

        let juror1 = env.get_account(0);
        let juror2 = env.get_account(1);
        let juror3 = env.get_account(2);

        contract.assign_jurors(1, vec![juror1, juror2, juror3]);

        env.set_caller(juror1);
        contract.cast_vote(1, VerdictOption::AgentAPreferred, "".to_string(), 500);

        env.set_caller(juror2);
        contract.cast_vote(1, VerdictOption::AgentAPreferred, "".to_string(), 800);

        // Third vote should trigger finalization
        env.set_caller(juror3);
        contract.cast_vote(1, VerdictOption::AgentAPreferred, "".to_string(), 750);

        let verdict = contract.get_verdict(1);
        assert_eq!(verdict, 0); // AgentAPreferred wins

        let vote_count = contract.get_vote_count(1);
        assert_eq!(vote_count, 3);
    }

    #[test]
    fn test_split_verdict() {
        let env = odra_test::env();
        let mut contract = VotingContract::deploy(&env, NoArgs);

        let juror1 = env.get_account(0);
        let juror2 = env.get_account(1);
        let juror3 = env.get_account(2);

        contract.assign_jurors(1, vec![juror1, juror2, juror3]);

        env.set_caller(juror1);
        contract.cast_vote(1, VerdictOption::AgentAPreferred, "".to_string(), 400);

        env.set_caller(juror2);
        contract.cast_vote(1, VerdictOption::SplitFifty, "".to_string(), 500);

        env.set_caller(juror3);
        contract.cast_vote(1, VerdictOption::AgentBPreferred, "".to_string(), 300);

        let verdict = contract.get_verdict(1);
        assert_eq!(verdict, 1); // SplitFifty wins
    }
}
