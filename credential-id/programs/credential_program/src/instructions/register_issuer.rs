use anchor_lang::prelude::*;
use crate::state::{CredentialNetwork, CredentialIssuer};
use crate::error::CredentialError;

#[derive(Accounts)]
pub struct RegisterIssuer<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [CredentialNetwork::SEED],
        bump = network.bump,
        constraint = network.admin == admin.key() @ CredentialError::UnauthorizedAdmin,
        constraint = network.is_active @ CredentialError::NetworkNotActive,
    )]
    pub network: Account<'info, CredentialNetwork>,

    /// The authority that will control the issuer
    /// CHECK: This is the issuer's wallet address
    pub issuer_authority: UncheckedAccount<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + CredentialIssuer::INIT_SPACE,
        seeds = [CredentialIssuer::SEED, issuer_authority.key().as_ref()],
        bump,
    )]
    pub issuer: Account<'info, CredentialIssuer>,

    pub system_program: Program<'info, System>,
}

pub fn register_issuer(
    ctx: Context<RegisterIssuer>,
    issuer_name: String,
    issuer_uri: String,
) -> Result<()> {
    require!(issuer_name.len() <= 64, CredentialError::NameTooLong);
    require!(issuer_uri.len() <= 200, CredentialError::UriTooLong);

    let issuer = &mut ctx.accounts.issuer;
    let network = &mut ctx.accounts.network;
    let clock = Clock::get()?;

    issuer.authority = ctx.accounts.issuer_authority.key();
    issuer.name = issuer_name;
    issuer.uri = issuer_uri;
    issuer.credentials_issued = 0;
    issuer.active_credentials = 0;
    issuer.revoked_credentials = 0;
    issuer.is_active = true;
    issuer.can_issue_kyc = true;
    issuer.can_issue_accredited = true;
    issuer.registered_at = clock.unix_timestamp;
    issuer.bump = ctx.bumps.issuer;

    // Update network stats
    network.total_issuers += 1;

    msg!("Issuer registered: {}", issuer.name);

    Ok(())
}
