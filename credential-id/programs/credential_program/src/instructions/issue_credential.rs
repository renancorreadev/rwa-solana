use anchor_lang::prelude::*;
use crate::state::{CredentialNetwork, CredentialIssuer, UserCredential, CredentialType, CredentialStatus};
use crate::error::CredentialError;

#[derive(Accounts)]
pub struct IssueCredential<'info> {
    #[account(mut)]
    pub issuer_authority: Signer<'info>,

    #[account(
        mut,
        seeds = [CredentialNetwork::SEED],
        bump = network.bump,
        constraint = network.is_active @ CredentialError::NetworkNotActive,
    )]
    pub network: Account<'info, CredentialNetwork>,

    #[account(
        mut,
        seeds = [CredentialIssuer::SEED, issuer_authority.key().as_ref()],
        bump = issuer.bump,
        constraint = issuer.is_active @ CredentialError::IssuerNotActive,
        constraint = issuer.authority == issuer_authority.key() @ CredentialError::UnauthorizedIssuer,
    )]
    pub issuer: Account<'info, CredentialIssuer>,

    /// The wallet receiving the credential
    /// CHECK: This is the credential holder's wallet
    pub holder: UncheckedAccount<'info>,

    #[account(
        init,
        payer = issuer_authority,
        space = 8 + UserCredential::INIT_SPACE,
        seeds = [UserCredential::SEED, holder.key().as_ref()],
        bump,
    )]
    pub credential: Account<'info, UserCredential>,

    pub system_program: Program<'info, System>,
}

pub fn issue_credential(
    ctx: Context<IssueCredential>,
    credential_type: u8,
    expiry_timestamp: i64,
    metadata_uri: String,
) -> Result<()> {
    require!(metadata_uri.len() <= 200, CredentialError::UriTooLong);

    let clock = Clock::get()?;

    // Validate expiry (must be in future or 0 for no expiry)
    require!(
        expiry_timestamp == 0 || expiry_timestamp > clock.unix_timestamp,
        CredentialError::InvalidExpiry
    );

    // Convert credential type
    let cred_type = match credential_type {
        0 => CredentialType::KycBasic,
        1 => CredentialType::KycFull,
        2 => CredentialType::AccreditedInvestor,
        3 => CredentialType::QualifiedPurchaser,
        4 => CredentialType::BrazilianCpf,
        5 => CredentialType::BrazilianCnpj,
        _ => return Err(CredentialError::InvalidCredentialType.into()),
    };

    let credential = &mut ctx.accounts.credential;
    let issuer = &mut ctx.accounts.issuer;
    let network = &mut ctx.accounts.network;

    credential.holder = ctx.accounts.holder.key();
    credential.issuer = ctx.accounts.issuer_authority.key();
    credential.credential_type = cred_type;
    credential.status = CredentialStatus::Active;
    credential.issued_at = clock.unix_timestamp;
    credential.expires_at = expiry_timestamp;
    credential.last_verified_at = clock.unix_timestamp;
    credential.metadata_uri = metadata_uri;
    credential.revocation_reason = String::new();
    credential.version = 1;
    credential.bump = ctx.bumps.credential;

    // Update stats
    issuer.credentials_issued += 1;
    issuer.active_credentials += 1;
    network.total_credentials_issued += 1;
    network.active_credentials += 1;

    msg!(
        "Credential issued to {} by {}",
        credential.holder,
        issuer.name
    );

    Ok(())
}
