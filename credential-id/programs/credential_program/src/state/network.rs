use anchor_lang::prelude::*;

/// Network configuration account
/// Stores global settings for the credential network
#[account]
#[derive(InitSpace)]
pub struct CredentialNetwork {
    /// Network admin authority
    pub admin: Pubkey,

    /// Network name (e.g., "Hub Credential Network")
    #[max_len(64)]
    pub name: String,

    /// Fee for issuing credentials (in lamports)
    pub credential_fee_lamports: u64,

    /// Total credentials issued
    pub total_credentials_issued: u64,

    /// Total active credentials
    pub active_credentials: u64,

    /// Total registered issuers
    pub total_issuers: u64,

    /// Network status
    pub is_active: bool,

    /// Created timestamp
    pub created_at: i64,

    /// Bump for PDA derivation
    pub bump: u8,
}

impl CredentialNetwork {
    pub const SEED: &'static [u8] = b"credential_network";
}
