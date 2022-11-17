import { BN, utils } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

import { PROGRAM_ID } from "./generated";

export const STAKE_ENTRY_SEED = "stake-entry";
export const findStakeEntryId = (
  stakePoolId: PublicKey,
  mintId: PublicKey,
  user?: PublicKey
): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode(STAKE_ENTRY_SEED),
      stakePoolId.toBuffer(),
      mintId.toBuffer(),
      user ? user.toBuffer() : PublicKey.default.toBuffer(),
    ],
    PROGRAM_ID
  )[0];
};

export const STAKE_POOL_SEED = "stake-pool";
export const findStakePoolId = (identifier: string): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode(STAKE_POOL_SEED),
      utils.bytes.utf8.encode(identifier),
    ],
    PROGRAM_ID
  )[0];
};

export const STAKE_AUTHORIZATION_RECORD_SEED = "stake-authorization";
export const findStakeAuthorizationRecordId = (
  stakePoolId: PublicKey,
  mintId: PublicKey
): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode(STAKE_AUTHORIZATION_RECORD_SEED),
      stakePoolId.toBuffer(),
      mintId.toBuffer(),
    ],
    PROGRAM_ID
  )[0];
};

export const USER_ESCROW_SEED = "escrow";
export const findUserEscrowId = (
  stakePoolId: PublicKey,
  user: PublicKey
): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode(USER_ESCROW_SEED),
      stakePoolId.toBuffer(),
      user.toBuffer(),
    ],
    PROGRAM_ID
  )[0];
};

export const STAKE_BOOSTER_SEED = "stake-booster";
export const findStakeBoosterId = (
  stakePoolId: PublicKey,
  identifier?: BN
): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode(REWARD_DISTRIBUTOR_SEED),
      stakePoolId.toBuffer(),
      (identifier ?? new BN(0)).toArrayLike(Buffer, "le", 8),
    ],
    PROGRAM_ID
  )[0];
};

export const REWARD_DISTRIBUTOR_SEED = "reward-distributor";
export const findRewardDistributorId = (
  stakePoolId: PublicKey,
  identifier?: BN
): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode(REWARD_DISTRIBUTOR_SEED),
      stakePoolId.toBuffer(),
      (identifier ?? new BN(0)).toArrayLike(Buffer, "le", 8),
    ],
    PROGRAM_ID
  )[0];
};

export const REWARD_ENTRY_SEED = "reward-entry";
export const findRewardEntryId = (
  rewardDistributorId: PublicKey,
  stakeEntryId: PublicKey
): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode(REWARD_ENTRY_SEED),
      rewardDistributorId.toBuffer(),
      stakeEntryId.toBuffer(),
    ],
    PROGRAM_ID
  )[0];
};

export const RECEIPT_MANAGER_SEED = "receipt-manager";
export const findReceiptManagerId = (
  stakePoolId: PublicKey,
  identifier: string
): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode(RECEIPT_MANAGER_SEED),
      stakePoolId.toBuffer(),
      utils.bytes.utf8.encode(identifier),
    ],
    PROGRAM_ID
  )[0];
};

export const REWARD_RECEIPT_SEED = "reward-receipt";
export const findRewardReceiptId = (
  receiptManagerId: PublicKey,
  stakeEntryId: PublicKey
): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode(REWARD_RECEIPT_SEED),
      receiptManagerId.toBuffer(),
      stakeEntryId.toBuffer(),
    ],
    PROGRAM_ID
  )[0];
};
