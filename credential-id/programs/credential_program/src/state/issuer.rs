use anchor_lang::prelude::*;

/// Credential Issuer account
/// Represents an authorized entity that can issue credentials
#[account]
#[derive(InitSpace)]
pub struct CredentialIssuer {
    /// Issuer authority (wallet that controls this issuer)
    pub authority: Pubkey,

    /// Issuer name (e.g., "Hub KYC Provider")
    #[max_len(64)]
    pub name: String,

    /// Issuer website/info URI
    #[max_len(200)]
    pub uri: String,

    /// Total credentials issued by this issuer
    pub credentials_issued: u64,

    /// Total active credentials
    pub active_credentials: u64,

    /// Total revoked credentials
    pub revoked_credentials: u64,

    /// Is this issuer active/authorized
    pub is_active: bool,

    /// Can issue KYC credentials
    pub can_issue_kyc: bool,

    /// Can issue Accredited Investor credentials
    pub can_issue_accredited: bool,

    /// Registration timestamp
    pub registered_at: i64,

    /// Bump for PDA derivation
    pub bump: u8,
}

impl CredentialIssuer {
    pub const SEED: &'static [u8] = b"issuer";
}
