use anchor_lang::prelude::*;
use crate::state::{UserCredential, CredentialStatus};
use crate::error::CredentialError;

/// Verify a credential - used by Transfer Hook
/// This instruction is called to verify that a holder has valid credentials
#[derive(Accounts)]
pub struct VerifyCredential<'info> {
    /// The wallet whose credential is being verified
    /// CHECK: This is just the holder address for PDA derivation
    pub holder: UncheckedAccount<'info>,

    #[account(
        seeds = [UserCredential::SEED, holder.key().as_ref()],
        bump = credential.bump,
    )]
    pub credential: Account<'info, UserCredential>,
}

pub fn verify_credential(ctx: Context<VerifyCredential>) -> Result<()> {
    let credential = &ctx.accounts.credential;
    let clock = Clock::get()?;

    // Check if credential is valid
    require!(
        credential.status == CredentialStatus::Active,
        CredentialError::CredentialNotActive
    );

    // Check expiry
    if credential.expires_at > 0 && clock.unix_timestamp > credential.expires_at {
        return Err(CredentialError::CredentialExpired.into());
    }

    msg!(
        "Credential verified for holder: {}",
        credential.holder
    );

    Ok(())
}

/// Helper function for CPI calls from other programs (like Transfer Hook)
/// Returns true if credential is valid, false otherwise
pub fn is_credential_valid(credential: &UserCredential, current_timestamp: i64) -> bool {
    credential.is_valid(current_timestamp)
}
