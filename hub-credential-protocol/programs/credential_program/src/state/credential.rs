use anchor_lang::prelude::*;

/// Credential Types for Real Estate Tokenization
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum CredentialType {
    /// Basic KYC - Identity verified
    KycBasic = 0,
    /// Full KYC - Identity + Address + Source of Funds
    KycFull = 1,
    /// Accredited Investor (for securities)
    AccreditedInvestor = 2,
    /// Qualified Purchaser (higher threshold)
    QualifiedPurchaser = 3,
    /// Brazilian CPF Verified
    BrazilianCpf = 4,
    /// Brazilian CNPJ Verified (for companies)
    BrazilianCnpj = 5,
}

/// Credential Status
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum CredentialStatus {
    /// Credential is active and valid
    Active = 0,
    /// Credential is expired
    Expired = 1,
    /// Credential was revoked
    Revoked = 2,
    /// Credential is suspended (temporarily invalid)
    Suspended = 3,
}

/// User Credential Account
/// Stores the on-chain credential for a wallet
/// This is what the Transfer Hook checks
#[account]
#[derive(InitSpace)]
pub struct UserCredential {
    /// The wallet this credential belongs to
    pub holder: Pubkey,

    /// The issuer who issued this credential
    pub issuer: Pubkey,

    /// Type of credential
    pub credential_type: CredentialType,

    /// Current status
    pub status: CredentialStatus,

    /// When the credential was issued
    pub issued_at: i64,

    /// When the credential expires (0 = never)
    pub expires_at: i64,

    /// When the credential was last verified/refreshed
    pub last_verified_at: i64,

    /// URI to off-chain metadata (encrypted PII hash, etc.)
    #[max_len(200)]
    pub metadata_uri: String,

    /// Revocation reason (if revoked)
    #[max_len(200)]
    pub revocation_reason: String,

    /// Credential version (for upgrades)
    pub version: u8,

    /// Bump for PDA derivation
    pub bump: u8,
}

impl UserCredential {
    pub const SEED: &'static [u8] = b"credential";

    /// Check if credential is valid for transfers
    pub fn is_valid(&self, current_timestamp: i64) -> bool {
        // Must be active
        if self.status != CredentialStatus::Active {
            return false;
        }

        // Check expiry (0 means never expires)
        if self.expires_at > 0 && current_timestamp > self.expires_at {
            return false;
        }

        true
    }

    /// Check if credential is expired
    pub fn is_expired(&self, current_timestamp: i64) -> bool {
        self.expires_at > 0 && current_timestamp > self.expires_at
    }
}
