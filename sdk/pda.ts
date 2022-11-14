import { utils } from "@project-serum/anchor";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { PublicKey } from "@solana/web3.js";

import { stakePool } from "./";

export const findStakeEntryId = (
  stakePoolId: PublicKey,
  mintId: PublicKey,
  user?: PublicKey
): PublicKey => {
  return findProgramAddressSync(
    [
      utils.bytes.utf8.encode("stake-entry"),
      stakePoolId.toBuffer(),
      mintId.toBuffer(),
      user ? user.toBuffer() : PublicKey.default.toBuffer(),
    ],
    stakePool.PROGRAM_ID
  )[0];
};

export const findStakePoolId = (identifier: string): PublicKey => {
  return findProgramAddressSync(
    [
      utils.bytes.utf8.encode("stake-pool"),
      utils.bytes.utf8.encode(identifier),
    ],
    stakePool.PROGRAM_ID
  )[0];
};

export const findUserEscrowId = (
  stakePoolId: PublicKey,
  user: PublicKey
): PublicKey => {
  return findProgramAddressSync(
    [
      utils.bytes.utf8.encode("escrow"),
      stakePoolId.toBuffer(),
      user.toBuffer(),
    ],
    stakePool.PROGRAM_ID
  )[0];
};
