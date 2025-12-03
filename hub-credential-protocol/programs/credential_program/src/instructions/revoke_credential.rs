use anchor_lang::prelude::*;
use crate::state::{CredentialNetwork, CredentialIssuer, UserCredential, CredentialStatus};
use crate::error::CredentialError;

#[derive(Accounts)]
pub struct RevokeCredential<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [CredentialNetwork::SEED],
        bump = network.bump,
    )]
    pub network: Account<'info, CredentialNetwork>,

    #[account(
        mut,
        seeds = [CredentialIssuer::SEED, authority.key().as_ref()],
        bump = issuer.bump,
    )]
    pub issuer: Account<'info, CredentialIssuer>,

    /// The wallet whose credential is being revoked
    /// CHECK: This is just the holder address for PDA derivation
    pub holder: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [UserCredential::SEED, holder.key().as_ref()],
        bump = credential.bump,
        constraint = credential.status == CredentialStatus::Active @ CredentialError::CredentialNotActive,
    )]
    pub credential: Account<'info, UserCredential>,
}

pub fn revoke_credential(
    ctx: Context<RevokeCredential>,
    reason: String,
) -> Result<()> {
    require!(reason.len() <= 200, CredentialError::ReasonTooLong);

    let credential = &mut ctx.accounts.credential;
    let issuer = &mut ctx.accounts.issuer;
    let network = &mut ctx.accounts.network;

    // Only the original issuer or network admin can revoke
    let is_issuer = credential.issuer == ctx.accounts.authority.key();
    let is_admin = network.admin == ctx.accounts.authority.key();

    require!(
        is_issuer || is_admin,
        CredentialError::UnauthorizedIssuer
    );

    // Update credential
    credential.status = CredentialStatus::Revoked;
    credential.revocation_reason = reason;

    // Update stats
    if is_issuer {
        issuer.active_credentials = issuer.active_credentials.saturating_sub(1);
        issuer.revoked_credentials += 1;
    }
    network.active_credentials = network.active_credentials.saturating_sub(1);

    msg!(
        "Credential revoked for holder: {}. Reason: {}",
        credential.holder,
        credential.revocation_reason
    );

    Ok(())
}
