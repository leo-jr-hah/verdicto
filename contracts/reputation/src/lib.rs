#![cfg_attr(not(test), no_std)]
#![cfg_attr(not(test), no_main)]
extern crate alloc;

use odra::prelude::*;

#[odra::odra_error]
pub enum RegistryError {
    NotAdmin = 0,
    AgentNotFound = 1,
    ScoreOutOfRange = 2,
}

#[odra::odra_type]
pub struct ReputationCard {
    pub agent_id: Address,
    pub general_score: u32,
    pub real_estate_score: u32,
    pub reliability_score: u32,
    pub assessment_count: u32,
}

#[odra::event]
pub struct AgentRegistered {
    pub agent_id: Address,
    pub initial_score: u32,
}

#[odra::event]
pub struct ReputationUpdated {
    pub agent_id: Address,
    pub domain: String,
    pub old_score: u32,
    pub new_score: u32,
}

#[odra::module]
pub struct ReputationRegistry {
    cards: Mapping<Address, ReputationCard>,
    agent_count: Var<u32>,
    admin: Var<Address>,
}

#[odra::module]
impl ReputationRegistry {
    pub fn init(&mut self) {
        self.admin.set(self.env().caller());
        self.agent_count.set(0);
    }

    pub fn register_agent(&mut self, agent_id: Address, initial_general: u32, initial_real_estate: u32) {
        self.assert_admin();

        let reliability = (initial_general + initial_real_estate) / 2;
        
        self.cards.set(&agent_id, ReputationCard {
            agent_id,
            general_score: initial_general,
            real_estate_score: initial_real_estate,
            reliability_score: reliability,
            assessment_count: 0,
        });

        let count = self.agent_count.get_or_default();
        self.agent_count.set(count + 1);

        self.env().emit_event(AgentRegistered {
            agent_id,
            initial_score: reliability,
        });
    }

    pub fn update_general_score(&mut self, agent_id: Address, delta: i32) {
        self.assert_admin();

        let mut card = self.cards.get(&agent_id).unwrap_or_revert_with(&self.env(), RegistryError::AgentNotFound);

        let old_score = card.general_score;
        let new_score = ((card.general_score as i32) + delta).max(0).min(1000) as u32;
        
        card.general_score = new_score;
        card.assessment_count += 1;
        card.reliability_score = (card.general_score + card.real_estate_score) / 2;
        
        self.cards.set(&agent_id, card);

        self.env().emit_event(ReputationUpdated {
            agent_id,
            domain: "general".to_string(),
            old_score,
            new_score,
        });
    }

    pub fn resolve_retroactive_reputation(&mut self, agent_id: Address, agent_estimate: u64, actual_price: u64) {
        self.assert_admin();

        let mut card = self.cards.get(&agent_id).unwrap_or_revert_with(&self.env(), RegistryError::AgentNotFound);

        let diff = if agent_estimate > actual_price { agent_estimate - actual_price } else { actual_price - agent_estimate };
        
        // Error % scaled by 1000 (e.g. 5% = 50)
        let err_pct = (diff * 1000) / actual_price;
        
        let delta: i32 = if err_pct < 50 { 50 }          // < 5% error -> +50
            else if err_pct < 150 { 10 }                 // < 15% error -> +10
            else if err_pct > 500 { -100 }               // > 50% error -> -100
            else if err_pct > 250 { -30 }                // > 25% error -> -30
            else { 0 };

        let old_score = card.general_score;
        let new_score = ((card.general_score as i32) + delta).max(0).min(1000) as u32;
        
        card.general_score = new_score;
        card.assessment_count += 1;
        card.reliability_score = (card.general_score + card.real_estate_score) / 2;
        
        self.cards.set(&agent_id, card);

        self.env().emit_event(ReputationUpdated {
            agent_id,
            domain: "general".to_string(),
            old_score,
            new_score,
        });
    }

    pub fn get_card(&self, agent_id: Address) -> Option<ReputationCard> {
        self.cards.get(&agent_id)
    }

    pub fn get_general_score(&self, agent_id: Address) -> u32 {
        self.cards.get(&agent_id).map(|c| c.general_score).unwrap_or(0)
    }

    pub fn get_agent_count(&self) -> u32 {
        self.agent_count.get_or_default()
    }

    fn assert_admin(&self) {
        let caller = self.env().caller();
        let admin = self.admin.get().unwrap_or_revert_with(&self.env(), RegistryError::NotAdmin);
        if caller != admin {
            self.env().revert(RegistryError::NotAdmin);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::{Deployer, NoArgs};

    #[test]
    fn test_register_and_get_agent() {
        let env = odra_test::env();
        let mut contract = ReputationRegistry::deploy(&env, NoArgs);

        let agent = env.get_account(1);
        contract.register_agent(agent, 700, 650);

        let card = contract.get_card(agent).unwrap();
        assert_eq!(card.general_score, 700);
        assert_eq!(card.real_estate_score, 650);
        assert_eq!(card.reliability_score, 675);
    }

    #[test]
    fn test_update_reputation() {
        let env = odra_test::env();
        let mut contract = ReputationRegistry::deploy(&env, NoArgs);

        let agent = env.get_account(1);
        contract.register_agent(agent, 700, 650);
        contract.update_general_score(agent, 50);

        assert_eq!(contract.get_general_score(agent), 750);
    }

    #[test]
    fn test_reputation_clamps_at_1000() {
        let env = odra_test::env();
        let mut contract = ReputationRegistry::deploy(&env, NoArgs);

        let agent = env.get_account(1);
        contract.register_agent(agent, 980, 500);
        contract.update_general_score(agent, 100);

        assert_eq!(contract.get_general_score(agent), 1000);
    }

    #[test]
    fn test_reputation_clamps_at_zero() {
        let env = odra_test::env();
        let mut contract = ReputationRegistry::deploy(&env, NoArgs);

        let agent = env.get_account(1);
        contract.register_agent(agent, 50, 500);
        contract.update_general_score(agent, -200);

        assert_eq!(contract.get_general_score(agent), 0);
    }

    #[test]
    fn test_agent_count() {
        let env = odra_test::env();
        let mut contract = ReputationRegistry::deploy(&env, NoArgs);

        assert_eq!(contract.get_agent_count(), 0);
        contract.register_agent(env.get_account(1), 700, 650);
        contract.register_agent(env.get_account(2), 800, 750);
        assert_eq!(contract.get_agent_count(), 2);
    }

    #[test]
    fn test_retroactive_reputation() {
        let env = odra_test::env();
        let mut contract = ReputationRegistry::deploy(&env, NoArgs);

        let agent1 = env.get_account(1); // Very accurate
        let agent2 = env.get_account(2); // Inaccurate
        
        contract.register_agent(agent1, 700, 650);
        contract.register_agent(agent2, 700, 650);

        // Actual price is 2,000,000
        // Agent 1 guessed 2,050,000 (2.5% error -> < 5% -> +50)
        contract.resolve_retroactive_reputation(agent1, 2_050_000, 2_000_000);
        assert_eq!(contract.get_general_score(agent1), 750);

        // Agent 2 guessed 1,400,000 (30% error -> > 25% -> -30)
        contract.resolve_retroactive_reputation(agent2, 1_400_000, 2_000_000);
        assert_eq!(contract.get_general_score(agent2), 670);
    }
}
