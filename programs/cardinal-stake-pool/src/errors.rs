use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Original mint is invalid")]
    InvalidOriginalMint,
    #[msg("Token Manager mint is invalid")]
    InvalidTokenManagerMint,
    #[msg("Invalid user original mint token account")]
    InvalidUserOriginalMintTokenAccount,
    #[msg("Invalid user token manager mint account")]
    InvalidUserMintTokenAccount,
    #[msg("Invalid stake entry original mint token account")]
    InvalidStakeEntryOriginalMintTokenAccount,
    #[msg("Invalid stake entry token manager mint token account")]
    InvalidStakeEntryMintTokenAccount,
    #[msg("Invalid unstake user only last staker can unstake")]
    InvalidUnstakeUser,
    #[msg("Invalid stake pool")]
    InvalidStakePool,
    #[msg("No mint metadata")]
    NoMintMetadata,
    #[msg("Mint not allowed in this pool")]
    MintNotAllowedInPool,
    #[msg("Invalid stake pool authority")]
    InvalidPoolAuthority,
    #[msg("Invalid stake type")]
    InvalidStakeType,
    #[msg("Invalid stake entry stake token account")]
    InvalidStakeEntryStakeTokenAccount,
    #[msg("Invalid last staker")]
    InvalidLastStaker,
    #[msg("Invalid token manager program")]
    InvalidTokenManagerProgram,
    #[msg("Invalid receipt mint")]
    InvalidReceiptMint,
    #[msg("Stake entry already has tokens staked")]
    StakeEntryAlreadyStaked,
    #[msg("Invalid authority")]
    InvalidAuthority,
    #[msg("Cannot close staked entry")]
    CannotCloseStakedEntry,
    #[msg("Cannot close staked entry")]
    CannotClosePoolWithStakedEntries,
    #[msg("Token still has some cooldown seconds remaining")]
    CooldownSecondRemaining,
    #[msg("Minimum stake seconds not satisfied")]
    MinStakeSecondsNotSatisfied,
    #[msg("Invalid stake authorization provided")]
    InvalidStakeAuthorizationRecord,
    #[msg("Invalid mint metadata")]
    InvalidMintMetadata,
    #[msg("Stake pool has ended")]
    StakePoolHasEnded,
    #[msg("Mint metadata is owned by the incorrect program")]
    InvalidMintMetadataOwner,
    #[msg("Stake mint already intialized")]
    StakeMintAlreadyInitialized,
    #[msg("Invalid stake entry")]
    InvalidStakeEntry,
    #[msg("Invalid payment mint")]
    InvalidPaymentMint,
    #[msg("Invalid payment mint token account")]
    InvalidPaymentMintTokenAccount,
    // boost errors
    #[msg("Cannot boost unstaked token")]
    CannotBoostUnstakedToken,
    #[msg("Cannot boost past current time less than start time")]
    CannotBoostMoreThanCurrentTime,
    #[msg("Invalid boost payer token account")]
    InvalidBoostPayerTokenAccount,
    #[msg("Invalid boost payment recipient token account")]
    InvalidBoostPaymentRecipientTokenAccount,
    #[msg("Invalid payment manager")]
    InvalidPaymentManager,
    #[msg("Cannot boost a fungible token stake entry")]
    CannotBoostFungibleToken,
}
