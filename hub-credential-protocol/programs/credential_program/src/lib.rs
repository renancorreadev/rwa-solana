use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt");

/// Hub Credential Protocol
///
/// A decentralized KYC/Verifiable Credentials system for Real Estate Tokenization.
/// Designed to replace Civic Pass with a self-hosted, compliant solution.
///
/// Features:
/// - On-chain credential storage and verification
/// - Multiple credential types (KYC, Accredited Investor, etc.)
/// - Issuer authorization system
/// - Credential revocation
/// - Integration with Transfer Hooks
#[program]
pub mod credential_program {
    use super::*;

    /// Initialize the credential network configuration
    /// Only called once by the protocol admin
    pub fn initialize_network(
        ctx: Context<InitializeNetwork>,
        network_name: String,
        credential_fee_lamports: u64,
    ) -> Result<()> {
        instructions::initialize_network(ctx, network_name, credential_fee_lamports)
    }

    /// Register a new credential issuer
    /// Issuers can issue credentials to users after KYC verification
    pub fn register_issuer(
        ctx: Context<RegisterIssuer>,
        issuer_name: String,
        issuer_uri: String,
    ) -> Result<()> {
        instructions::register_issuer(ctx, issuer_name, issuer_uri)
    }

    /// Issue a credential to a wallet
    /// Called by authorized issuers after off-chain KYC verification
    pub fn issue_credential(
        ctx: Context<IssueCredential>,
        credential_type: u8,
        expiry_timestamp: i64,
        metadata_uri: String,
    ) -> Result<()> {
        instructions::issue_credential(ctx, credential_type, expiry_timestamp, metadata_uri)
    }

    /// Verify a credential on-chain
    /// Returns the credential status for Transfer Hook integration
    pub fn verify_credential(ctx: Context<VerifyCredential>) -> Result<()> {
        instructions::verify_credential(ctx)
    }

    /// Revoke a credential
    /// Can be called by issuer or network admin
    pub fn revoke_credential(
        ctx: Context<RevokeCredential>,
        reason: String,
    ) -> Result<()> {
        instructions::revoke_credential(ctx, reason)
    }

    /// Refresh/renew a credential
    /// Extends expiry without full re-verification
    pub fn refresh_credential(
        ctx: Context<RefreshCredential>,
        new_expiry_timestamp: i64,
    ) -> Result<()> {
        instructions::refresh_credential(ctx, new_expiry_timestamp)
    }
}
