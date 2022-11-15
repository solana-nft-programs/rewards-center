use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    // validations
    #[msg("Invalid stake pool")]
    InvalidStakePool = 0,
    #[msg("Invalid stake entry")]
    InvalidStakeEntry,
    #[msg("Invalid stake pool authority")]
    InvalidAuthority,
    #[msg("Mismatched user and escrow")]
    InvalidEscrow,

    // actions
    #[msg("Invalid user original mint token account")]
    InvalidUserStakeMintTokenAccount = 10,
    #[msg("Invalid last staker")]
    InvalidLastStaker,
    #[msg("Cannot update unstaked entry")]
    CannotUpdateUnstakedEntry,
    #[msg("Cannot close staked entry")]
    CannotCloseStakedEntry,
    #[msg("Cannot close staked entry")]
    CannotClosePoolWithStakedEntries,

    // authorization errors
    #[msg("Invalid mint metadata")]
    InvalidMintMetadata = 20,
    #[msg("Mint not allowed in this pool")]
    MintNotAllowedInPool,
    #[msg("Invalid stake authorization provided")]
    InvalidStakeAuthorizationRecord,
    #[msg("Mint metadata is owned by the incorrect program")]
    InvalidMintMetadataOwner,

    // payment errors
    #[msg("Invalid payment mint")]
    InvalidPaymentMint = 30,

    // cooldown errors
    #[msg("Token still has some cooldown seconds remaining")]
    CooldownSecondRemaining = 40,

    // stake_pool errors
    #[msg("Stake pool has ended")]
    StakePoolHasEnded = 50,
    #[msg("Minimum stake seconds not satisfied")]
    MinStakeSecondsNotSatisfied,

    // boost errors
    #[msg("Cannot boost unstaked token")]
    CannotBoostUnstakedToken = 60,
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

    // reward_receipt errors
    #[msg("Max number of receipts exceeded")]
    MaxNumberOfReceiptsExceeded = 70,
    #[msg("Invalid claimer")]
    InvalidClaimer,
    #[msg("Reward seconds not satisifed")]
    RewardSecondsNotSatisfied,
    #[msg("Invalid payer token account")]
    InvalidPayerTokenAcount,
    #[msg("Invalid max claimed receipts")]
    InvalidMaxClaimedReceipts,
    #[msg("Invalid payment token account")]
    InvalidPaymentTokenAccount,
    #[msg("Invalid payment collector")]
    InvalidPaymentCollector,
    #[msg("Invalid reward receipt")]
    InvalidRewardReceipt,
    #[msg("Invalid receipt entry")]
    InvalidReceiptEntry,
    #[msg("Insufficient available stake seconds to use")]
    InsufficientAvailableStakeSeconds,
    #[msg("Invalid receipt manager")]
    InvalidReceiptManager,
    #[msg("Reward receipt is not allowed")]
    RewardReceiptIsNotAllowed,
    #[msg("Reward receipt already claimed")]
    RewardReceiptAlreadyClaimed,
}
