#![cfg_attr(not(test), no_std)]
#![cfg_attr(not(test), no_main)]
extern crate alloc;

use odra::prelude::*;

#[odra::odra_error]
pub enum EscrowError {
    InsufficientFee = 0,
    DisputeNotFound = 1,
    NotAdmin = 2,
}

#[odra::odra_type]
pub enum EscrowStatus {
    Active,
    Settled,
    Refunded,
}

#[odra::odra_type]
pub struct EscrowRecord {
    pub dispute_id: u64,
    pub filer: Address,
    pub asset_id: String,
    pub filing_fee_motes: u64,
    pub status: EscrowStatus,
    pub filed_at: u64,
}

#[odra::event]
pub struct DisputeFiled {
    pub dispute_id: u64,
    pub filer: Address,
    pub asset_id: String,
}

#[odra::event]
pub struct DisputeSettled {
    pub dispute_id: u64,
}

#[odra::module]
pub struct EscrowContract {
    escrows: Mapping<u64, EscrowRecord>,
    dispute_counter: Var<u64>,
    min_filing_fee: Var<u64>,
    admin: Var<Address>,
}

#[odra::module]
impl EscrowContract {
    pub fn init(&mut self) {
        self.admin.set(self.env().caller());
        self.dispute_counter.set(0);
        self.min_filing_fee.set(100_000_000u64); // 0.1 CSPR
    }

    pub fn file_dispute(&mut self, asset_id: String, fee_motes: u64) -> u64 {
        let caller = self.env().caller();
        let min_fee = self.min_filing_fee.get_or_default();

        if fee_motes < min_fee {
            self.env().revert(EscrowError::InsufficientFee);
        }

        let id = self.dispute_counter.get_or_default() + 1;
        self.dispute_counter.set(id);

        self.escrows.set(&id, EscrowRecord {
            dispute_id: id,
            filer: caller,
            asset_id: asset_id.clone(),
            filing_fee_motes: fee_motes,
            status: EscrowStatus::Active,
            filed_at: self.env().get_block_time(),
        });

        self.env().emit_event(DisputeFiled { dispute_id: id, filer: caller, asset_id });
        
        id
    }

    pub fn settle_dispute(&mut self, dispute_id: u64) {
        self.assert_admin();

        let mut record = self.escrows.get(&dispute_id).unwrap_or_revert_with(&self.env(), EscrowError::DisputeNotFound);
        record.status = EscrowStatus::Settled;
        self.escrows.set(&dispute_id, record);

        self.env().emit_event(DisputeSettled { dispute_id });
    }

    pub fn get_escrow(&self, dispute_id: u64) -> Option<EscrowRecord> {
        self.escrows.get(&dispute_id)
    }

    pub fn get_dispute_count(&self) -> u64 {
        self.dispute_counter.get_or_default()
    }

    fn assert_admin(&self) {
        let caller = self.env().caller();
        let admin = self.admin.get().unwrap_or_revert_with(&self.env(), EscrowError::NotAdmin);
        if caller != admin {
            self.env().revert(EscrowError::NotAdmin);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::{Deployer, NoArgs};

    #[test]
    fn test_file_dispute_success() {
        let env = odra_test::env();
        let mut contract = EscrowContract::deploy(&env, NoArgs);

        let id = contract.file_dispute("PARKING-MIAMI-001".to_string(), 100_000_000u64);
        assert_eq!(id, 1);
        
        let record = contract.get_escrow(1).unwrap();
        assert_eq!(record.asset_id, "PARKING-MIAMI-001");
        assert_eq!(record.filing_fee_motes, 100_000_000u64);
    }

    #[test]
    fn test_dispute_counter_increments() {
        let env = odra_test::env();
        let mut contract = EscrowContract::deploy(&env, NoArgs);

        contract.file_dispute("PARKING-001".to_string(), 100_000_000u64);
        contract.file_dispute("PARKING-002".to_string(), 200_000_000u64);

        assert_eq!(contract.get_dispute_count(), 2);
    }

    #[test]
    fn test_insufficient_fee_reverts() {
        let env = odra_test::env();
        let mut contract = EscrowContract::deploy(&env, NoArgs);

        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            contract.file_dispute("PARKING-001".to_string(), 10_000_000u64);
        }));
        assert!(result.is_err());
    }
}
