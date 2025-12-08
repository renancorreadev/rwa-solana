use anchor_lang::prelude::*;
use crate::state::CredentialNetwork;
use crate::error::CredentialError;

#[derive(Accounts)]
pub struct InitializeNetwork<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + CredentialNetwork::INIT_SPACE,
        seeds = [CredentialNetwork::SEED],
        bump,
    )]
    pub network: Account<'info, CredentialNetwork>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_network(
    ctx: Context<InitializeNetwork>,
    network_name: String,
    credential_fee_lamports: u64,
) -> Result<()> {
    require!(network_name.len() <= 64, CredentialError::NameTooLong);

    let network = &mut ctx.accounts.network;
    let clock = Clock::get()?;

    network.admin = ctx.accounts.admin.key();
    network.name = network_name;
    network.credential_fee_lamports = credential_fee_lamports;
    network.total_credentials_issued = 0;
    network.active_credentials = 0;
    network.total_issuers = 0;
    network.is_active = true;
    network.created_at = clock.unix_timestamp;
    network.bump = ctx.bumps.network;

    msg!("Credential Network initialized: {}", network.name);

    Ok(())
}
