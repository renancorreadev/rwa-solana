/// Invest in property - handles payment and token minting atomically
use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{self, Token2022, MintTo},
    token_interface::{Mint, TokenAccount},
};

use crate::{constants::*, error::RwaError, events::*, state::*, utils::*};

#[derive(Accounts)]
pub struct InvestInProperty<'info> {
    /// Investor making the investment (pays SOL, receives tokens)
    #[account(mut)]
    pub investor: Signer<'info>,

    /// PropertyState PDA
    #[account(
        mut,
        seeds = [PROPERTY_STATE_SEED, mint.key().as_ref()],
        bump = property_state.bump,
        has_one = mint @ RwaError::InvalidMint,
    )]
    pub property_state: Box<Account<'info, PropertyState>>,

    /// Investment Vault PDA (holds escrow + reserve accounting)
    #[account(
        mut,
        seeds = [INVESTMENT_VAULT_SEED, mint.key().as_ref()],
        bump = investment_vault.bump,
        constraint = investment_vault.is_initialized @ RwaError::VaultNotInitialized,
    )]
    pub investment_vault: Box<Account<'info, InvestmentVault>>,

    /// Reserve Fund PDA (holds reserve SOL)
    /// CHECK: PDA that holds the reserve funds
    #[account(
        mut,
        seeds = [RESERVE_FUND_SEED, mint.key().as_ref()],
        bump,
    )]
    pub reserve_fund: UncheckedAccount<'info>,

    /// The property token mint (Token-2022)
    #[account(mut)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    /// Investor's token account
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = investor,
        associated_token::token_program = token_program,
    )]
    pub investor_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Hub Credential account for investor KYC
    /// CHECK: Will be verified using Hub Credential program
    pub investor_credential: UncheckedAccount<'info>,

    /// Platform Treasury - receives platform fees
    /// CHECK: Verified against constant PLATFORM_TREASURY
    #[account(
        mut,
        constraint = platform_treasury.key() == PLATFORM_TREASURY @ RwaError::InvalidPlatformTreasury,
    )]
    pub platform_treasury: UncheckedAccount<'info>,

    /// Seller wallet - receives escrow releases
    /// CHECK: Verified against investment_vault.seller
    #[account(
        mut,
        constraint = seller.key() == investment_vault.seller @ RwaError::InvalidSeller,
    )]
    pub seller: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

/// Handler for invest_in_property instruction
///
/// # Arguments
/// * `sol_amount` - Amount of SOL to invest (in lamports)
/// * `expected_tokens` - Expected number of tokens to receive (for slippage protection)
pub fn handler(
    ctx: Context<InvestInProperty>,
    sol_amount: u64,
    expected_tokens: u64,
) -> Result<()> {
    let property_state = &ctx.accounts.property_state;
    let investment_vault = &mut ctx.accounts.investment_vault;

    // 1. Validate investment amount
    require!(sol_amount > 0, RwaError::InvalidInvestmentAmount);

    // 2. Verify property is active
    require!(property_state.is_active, RwaError::PropertyNotActive);

    // 3. Verify investor has sufficient SOL balance
    require!(
        ctx.accounts.investor.lamports() >= sol_amount,
        RwaError::InsufficientSolBalance
    );

    // 4. Verify Hub Credential for KYC compliance
    verify_hub_credential(
        &ctx.accounts.investor_credential.to_account_info(),
        &ctx.accounts.investor.key(),
        &ctx.accounts.mint.key(),
    )?;

    msg!(
        "Hub Credential verification passed for investor: {}",
        ctx.accounts.investor.key()
    );

    // 5. Calculate fee distribution
    let platform_fee = InvestmentVault::calculate_platform_fee(sol_amount)?;
    let reserve_amount = InvestmentVault::calculate_reserve_amount(sol_amount)?;
    let escrow_amount = InvestmentVault::calculate_escrow_amount(sol_amount)?;

    msg!(
        "Investment distribution: Platform={} Reserve={} Escrow={}",
        platform_fee, reserve_amount, escrow_amount
    );

    // 6. Transfer platform fee to treasury
    if platform_fee > 0 {
        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.investor.to_account_info(),
                    to: ctx.accounts.platform_treasury.to_account_info(),
                },
            ),
            platform_fee,
        )?;
        msg!("Transferred {} lamports to platform treasury", platform_fee);
    }

    // 7. Transfer reserve to reserve fund PDA
    if reserve_amount > 0 {
        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.investor.to_account_info(),
                    to: ctx.accounts.reserve_fund.to_account_info(),
                },
            ),
            reserve_amount,
        )?;
        msg!("Transferred {} lamports to reserve fund", reserve_amount);
    }

    // 8. Transfer escrow to seller (for now direct, can be changed to escrow PDA)
    // In production, this could go to an escrow PDA with milestone-based release
    if escrow_amount > 0 {
        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.investor.to_account_info(),
                    to: ctx.accounts.seller.to_account_info(),
                },
            ),
            escrow_amount,
        )?;
        msg!("Transferred {} lamports to seller", escrow_amount);
    }

    // 9. Verify token amount doesn't exceed supply
    let property_state = &mut ctx.accounts.property_state;
    require!(
        property_state.circulating_supply + expected_tokens <= property_state.total_supply,
        RwaError::ExceedsMaxSupply
    );

    // 10. Mint tokens to investor
    let mint_key = property_state.mint;
    let seeds = &[
        PROPERTY_STATE_SEED,
        mint_key.as_ref(),
        &[property_state.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let cpi_context = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.investor_token_account.to_account_info(),
            authority: property_state.to_account_info(),
        },
        signer_seeds,
    );

    token_2022::mint_to(cpi_context, expected_tokens)?;

    // 11. Update property state
    property_state.circulating_supply += expected_tokens;
    property_state.updated_at = Clock::get()?.unix_timestamp;

    // 12. Update investment vault
    investment_vault.total_invested = investment_vault.total_invested
        .checked_add(sol_amount)
        .ok_or(RwaError::MathOverflow)?;
    investment_vault.total_platform_fees = investment_vault.total_platform_fees
        .checked_add(platform_fee)
        .ok_or(RwaError::MathOverflow)?;
    investment_vault.reserve_balance = investment_vault.reserve_balance
        .checked_add(reserve_amount)
        .ok_or(RwaError::MathOverflow)?;
    investment_vault.escrow_balance = investment_vault.escrow_balance
        .checked_add(escrow_amount)
        .ok_or(RwaError::MathOverflow)?;
    investment_vault.updated_at = Clock::get()?.unix_timestamp;

    // 13. Check and update milestones
    let circulation_bps = ((property_state.circulating_supply as u128 * BPS_DIVISOR as u128)
        / property_state.total_supply as u128) as u16;

    let (new_milestone, _) = investment_vault.check_milestone(circulation_bps);
    if new_milestone > investment_vault.current_milestone {
        investment_vault.current_milestone = new_milestone;
        msg!("Milestone {} reached!", new_milestone);
    }

    // 14. Emit investment event
    emit!(InvestmentMade {
        property_mint: ctx.accounts.mint.key(),
        investor: ctx.accounts.investor.key(),
        sol_amount,
        tokens_received: expected_tokens,
        platform_fee,
        reserve_amount,
        escrow_amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!(
        "Investment successful: {} SOL -> {} tokens for investor {}",
        sol_amount,
        expected_tokens,
        ctx.accounts.investor.key()
    );

    Ok(())
}

/// Initialize Investment Vault for a property
#[derive(Accounts)]
pub struct InitializeInvestmentVault<'info> {
    /// Property authority (must be the property owner)
    #[account(mut)]
    pub authority: Signer<'info>,

    /// PropertyState PDA - to verify authority
    #[account(
        seeds = [PROPERTY_STATE_SEED, mint.key().as_ref()],
        bump = property_state.bump,
        has_one = authority @ RwaError::Unauthorized,
        has_one = mint @ RwaError::InvalidMint,
    )]
    pub property_state: Box<Account<'info, PropertyState>>,

    /// Investment Vault PDA to initialize
    #[account(
        init,
        payer = authority,
        space = 8 + InvestmentVault::INIT_SPACE,
        seeds = [INVESTMENT_VAULT_SEED, mint.key().as_ref()],
        bump,
    )]
    pub investment_vault: Box<Account<'info, InvestmentVault>>,

    /// Reserve Fund PDA - just derive to verify
    /// CHECK: PDA derivation verified
    #[account(
        seeds = [RESERVE_FUND_SEED, mint.key().as_ref()],
        bump,
    )]
    pub reserve_fund: UncheckedAccount<'info>,

    /// The property token mint
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    /// Seller wallet that will receive escrow releases
    /// CHECK: Just storing the pubkey, verified by authority
    pub seller: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

/// Handler for initialize_investment_vault instruction
pub fn handler_initialize_vault(ctx: Context<InitializeInvestmentVault>) -> Result<()> {
    let investment_vault = &mut ctx.accounts.investment_vault;
    let clock = Clock::get()?;

    investment_vault.property_mint = ctx.accounts.mint.key();
    investment_vault.seller = ctx.accounts.seller.key();
    investment_vault.total_invested = 0;
    investment_vault.total_platform_fees = 0;
    investment_vault.reserve_balance = 0;
    investment_vault.escrow_balance = 0;
    investment_vault.total_released_to_seller = 0;
    investment_vault.current_milestone = 0;
    investment_vault.is_initialized = true;
    investment_vault.created_at = clock.unix_timestamp;
    investment_vault.updated_at = clock.unix_timestamp;
    investment_vault.bump = ctx.bumps.investment_vault;

    emit!(InvestmentVaultInitialized {
        property_mint: ctx.accounts.mint.key(),
        seller: ctx.accounts.seller.key(),
        timestamp: clock.unix_timestamp,
    });

    msg!(
        "Investment vault initialized for property {} with seller {}",
        ctx.accounts.mint.key(),
        ctx.accounts.seller.key()
    );

    Ok(())
}
