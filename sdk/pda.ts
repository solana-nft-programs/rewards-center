import { utils } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

import { REWARDS_CENTER_ADDRESS } from "./constants";

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
    REWARDS_CENTER_ADDRESS
  )[0];
};

export const STAKE_POOL_SEED = "stake-pool";
export const findStakePoolId = (identifier: string): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode(STAKE_POOL_SEED),
      utils.bytes.utf8.encode(identifier),
    ],
    REWARDS_CENTER_ADDRESS
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
    REWARDS_CENTER_ADDRESS
  )[0];
};
