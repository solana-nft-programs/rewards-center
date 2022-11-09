use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid token account")]
    InvalidTokenAccount,
    #[msg("Invalid reward mint")]
    InvalidRewardMint,
    #[msg("Invalid user reward mint token account")]
    InvalidUserRewardMintTokenAccount,
    #[msg("Invalid reward distributor")]
    InvalidRewardDistributor,
    #[msg("Invalid reward distributor authority")]
    InvalidRewardDistributorAuthority,
    #[msg("Invalid reward distributor kind")]
    InvalidRewardDistributorKind,
    #[msg("Initial supply required for kind treasury")]
    SupplyRequired,
    #[msg("Invalid authority")]
    InvalidAuthority,
    #[msg("Invalid distributor for pool")]
    InvalidPoolDistributor,
    #[msg("Distributor is already open")]
    DistributorNotClosed,
    #[msg("Distributor is already closed")]
    DistributorAlreadyClosed,
    #[msg("Invalid stake entry")]
    InvalidStakeEntry,
    #[msg("Invalid reward entry")]
    InvalidRewardEntry,
    #[msg("Invalid reward distributor token account")]
    InvalidRewardDistributorTokenAccount,
    #[msg("Invalid authority token account")]
    InvalidAuthorityTokenAccount,
    #[msg("Invalid payer")]
    InvalidPayer,
}
