use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid authority")]
    InvalidAuthority,
    #[msg("Max number of receipts exceeded")]
    MaxNumberOfReceiptsExceeded,
    #[msg("Invalid claimer")]
    InvalidClaimer,
    #[msg("Reward seconds not satisifed")]
    RewardSecondsNotSatisfied,
    #[msg("Invalid payer token account")]
    InvalidPayerTokenAcount,
    #[msg("Invalid payment mint")]
    InvalidPaymentMint,
    #[msg("Invalid payment manager")]
    InvalidPaymentManager,
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
    #[msg("Invalid stake entry")]
    InvalidStakeEntry,
    #[msg("Invalid receipt manager")]
    InvalidReceiptManager,
    #[msg("Reward receipt is not allowed")]
    RewardReceiptIsNotAllowed,
    #[msg("Reward receipt already claimed")]
    RewardReceiptAlreadyClaimed,
}
