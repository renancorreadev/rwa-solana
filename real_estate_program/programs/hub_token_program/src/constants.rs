/// Program constants and seeds for PDA derivation
use anchor_lang::prelude::*;

// ============================================================================
// PDA SEEDS
// ============================================================================

/// Seed for PropertyState PDA derivation
pub const PROPERTY_STATE_SEED: &[u8] = b"property";

/// Seed for PropertyVault PDA (revenue distribution)
pub const PROPERTY_VAULT_SEED: &[u8] = b"property_vault";

/// Seed for InvestmentVault PDA (investor payments escrow)
pub const INVESTMENT_VAULT_SEED: &[u8] = b"investment_vault";

/// Seed for Reserve Fund PDA (property maintenance/guarantee)
pub const RESERVE_FUND_SEED: &[u8] = b"reserve_fund";

// ============================================================================
// STRING LENGTH LIMITS
// ============================================================================

/// Maximum length for property name
pub const MAX_PROPERTY_NAME_LEN: usize = 50;

/// Maximum length for property symbol (ticker)
pub const MAX_PROPERTY_SYMBOL_LEN: usize = 10;

/// Maximum length for property address
pub const MAX_PROPERTY_ADDRESS_LEN: usize = 200;

/// Maximum length for property type description
pub const MAX_PROPERTY_TYPE_LEN: usize = 100;

/// Maximum length for metadata URI (IPFS/Arweave)
pub const MAX_METADATA_URI_LEN: usize = 500;

// ============================================================================
// EXTERNAL PROGRAMS
// ============================================================================

/// Hub Credential Program ID
/// Custom KYC/Verifiable Credentials protocol for Hub Token
pub const HUB_CREDENTIAL_PROGRAM_ID: Pubkey = pubkey!("FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt");

// ============================================================================
// FEES AND DISTRIBUTION (in basis points: 100 bps = 1%)
// ============================================================================

/// Platform fee in basis points (2.5% = 250 bps)
/// Goes to Kota Treasury for platform sustainability
pub const PLATFORM_FEE_BPS: u16 = 250;

/// Reserve fund fee in basis points (7.5% = 750 bps)
/// Stays in property vault for maintenance/emergencies/guarantee
pub const RESERVE_FEE_BPS: u16 = 750;

/// Seller escrow percentage in basis points (90% = 9000 bps)
/// Goes to seller vault, released based on milestones
pub const SELLER_ESCROW_BPS: u16 = 9000;

/// Basis points divisor (10000 = 100%)
pub const BPS_DIVISOR: u64 = 10000;

/// Kota Platform Treasury Address
/// All platform fees are sent to this address
pub const PLATFORM_TREASURY: Pubkey = pubkey!("AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw");

// ============================================================================
// MILESTONE THRESHOLDS (for seller escrow release)
// ============================================================================

/// First milestone: 50% tokens sold - releases 50% of escrow
pub const MILESTONE_1_THRESHOLD_BPS: u16 = 5000;  // 50%
pub const MILESTONE_1_RELEASE_BPS: u16 = 5000;    // Release 50%

/// Second milestone: 75% tokens sold - releases 30% more
pub const MILESTONE_2_THRESHOLD_BPS: u16 = 7500;  // 75%
pub const MILESTONE_2_RELEASE_BPS: u16 = 3000;    // Release 30%

/// Final milestone: 100% tokens sold - releases remaining 20%
pub const MILESTONE_3_THRESHOLD_BPS: u16 = 10000; // 100%
pub const MILESTONE_3_RELEASE_BPS: u16 = 2000;    // Release 20%

// ============================================================================
// YIELD LIMITS
// ============================================================================

/// Minimum rental yield in basis points (0.01% = 1 bps)
pub const MIN_RENTAL_YIELD_BPS: u16 = 0;

/// Maximum rental yield in basis points (100% = 10000 bps)
pub const MAX_RENTAL_YIELD_BPS: u16 = 10000;

// ============================================================================
// KYC SETTINGS
// ============================================================================

/// KYC grace period in seconds (7 days) for expiring credentials
pub const KYC_GRACE_PERIOD_SECONDS: i64 = 7 * 24 * 60 * 60;
