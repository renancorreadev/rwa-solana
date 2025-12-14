/// Investment Vault state for property investment escrow and reserve funds
use anchor_lang::prelude::*;
use crate::constants::*;

/// Tracks investment funds for a property
/// - Seller escrow: Released based on sales milestones
/// - Reserve fund: Permanent guarantee for maintenance/emergencies
#[account]
#[derive(InitSpace, Debug)]
pub struct InvestmentVault {
    /// The property mint this vault belongs to
    pub property_mint: Pubkey,

    /// Seller/property owner wallet (receives escrow releases)
    pub seller: Pubkey,

    /// Total SOL deposited by investors (in lamports)
    pub total_invested: u64,

    /// Total platform fees collected (in lamports)
    pub total_platform_fees: u64,

    /// Current reserve fund balance (in lamports)
    /// This stays in the vault as guarantee
    pub reserve_balance: u64,

    /// Current seller escrow balance (in lamports)
    /// Released based on milestones
    pub escrow_balance: u64,

    /// Total amount released to seller (in lamports)
    pub total_released_to_seller: u64,

    /// Current milestone reached (0-3)
    /// 0 = No milestone, 1 = 50% sold, 2 = 75% sold, 3 = 100% sold
    pub current_milestone: u8,

    /// Whether vault is initialized
    pub is_initialized: bool,

    /// Timestamp when vault was created
    pub created_at: i64,

    /// Timestamp of last update
    pub updated_at: i64,

    /// PDA bump seed
    pub bump: u8,
}

impl InvestmentVault {
    /// Calculate platform fee from investment amount
    pub fn calculate_platform_fee(amount: u64) -> Result<u64> {
        amount
            .checked_mul(PLATFORM_FEE_BPS as u64)
            .and_then(|v| v.checked_div(BPS_DIVISOR))
            .ok_or(error!(crate::error::RwaError::MathOverflow))
    }

    /// Calculate reserve fund amount from investment
    pub fn calculate_reserve_amount(amount: u64) -> Result<u64> {
        amount
            .checked_mul(RESERVE_FEE_BPS as u64)
            .and_then(|v| v.checked_div(BPS_DIVISOR))
            .ok_or(error!(crate::error::RwaError::MathOverflow))
    }

    /// Calculate seller escrow amount from investment
    pub fn calculate_escrow_amount(amount: u64) -> Result<u64> {
        amount
            .checked_mul(SELLER_ESCROW_BPS as u64)
            .and_then(|v| v.checked_div(BPS_DIVISOR))
            .ok_or(error!(crate::error::RwaError::MathOverflow))
    }

    /// Check if a milestone is reached based on circulation percentage
    /// Returns (milestone_number, amount_to_release)
    pub fn check_milestone(&self, circulation_bps: u16) -> (u8, u64) {
        let current = self.current_milestone;

        // Already at max milestone
        if current >= 3 {
            return (3, 0);
        }

        // Check milestone 3: 100% sold
        if current < 3 && circulation_bps >= MILESTONE_3_THRESHOLD_BPS {
            let release = self.escrow_balance
                .checked_mul(MILESTONE_3_RELEASE_BPS as u64)
                .and_then(|v| v.checked_div(BPS_DIVISOR))
                .unwrap_or(0);
            return (3, release);
        }

        // Check milestone 2: 75% sold
        if current < 2 && circulation_bps >= MILESTONE_2_THRESHOLD_BPS {
            let release = self.escrow_balance
                .checked_mul(MILESTONE_2_RELEASE_BPS as u64)
                .and_then(|v| v.checked_div(BPS_DIVISOR))
                .unwrap_or(0);
            return (2, release);
        }

        // Check milestone 1: 50% sold
        if current < 1 && circulation_bps >= MILESTONE_1_THRESHOLD_BPS {
            let release = self.escrow_balance
                .checked_mul(MILESTONE_1_RELEASE_BPS as u64)
                .and_then(|v| v.checked_div(BPS_DIVISOR))
                .unwrap_or(0);
            return (1, release);
        }

        (current, 0)
    }

    /// Get total value locked (escrow + reserve)
    pub fn total_value_locked(&self) -> u64 {
        self.escrow_balance.saturating_add(self.reserve_balance)
    }
}
