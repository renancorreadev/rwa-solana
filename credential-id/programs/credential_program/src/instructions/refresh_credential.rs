use anchor_lang::prelude::*;
use crate::state::{CredentialIssuer, UserCredential, CredentialStatus};
use crate::error::CredentialError;

#[derive(Accounts)]
pub struct RefreshCredential<'info> {
    #[account(mut)]
    pub issuer_authority: Signer<'info>,

    #[account(
        seeds = [CredentialIssuer::SEED, issuer_authority.key().as_ref()],
        bump = issuer.bump,
        constraint = issuer.is_active @ CredentialError::IssuerNotActive,
        constraint = issuer.authority == issuer_authority.key() @ CredentialError::UnauthorizedIssuer,
    )]
    pub issuer: Account<'info, CredentialIssuer>,

    /// The wallet whose credential is being refreshed
    /// CHECK: This is just the holder address for PDA derivation
    pub holder: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [UserCredential::SEED, holder.key().as_ref()],
        bump = credential.bump,
        constraint = credential.issuer == issuer_authority.key() @ CredentialError::UnauthorizedIssuer,
    )]
    pub credential: Account<'info, UserCredential>,
}

pub fn refresh_credential(
    ctx: Context<RefreshCredential>,
    new_expiry_timestamp: i64,
) -> Result<()> {
    let clock = Clock::get()?;
    let credential = &mut ctx.accounts.credential;

    // Validate new expiry (must be in future or 0)
    require!(
        new_expiry_timestamp == 0 || new_expiry_timestamp > clock.unix_timestamp,
        CredentialError::InvalidExpiry
    );

    // Can only refresh Active or Expired credentials (not Revoked)
    require!(
        credential.status == CredentialStatus::Active ||
        credential.status == CredentialStatus::Expired,
        CredentialError::CredentialRevoked
    );

    // Update credential
    credential.status = CredentialStatus::Active;
    credential.expires_at = new_expiry_timestamp;
    credential.last_verified_at = clock.unix_timestamp;

    msg!(
        "Credential refreshed for holder: {}. New expiry: {}",
        credential.holder,
        new_expiry_timestamp
    );

    Ok(())
}
