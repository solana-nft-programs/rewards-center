import { utils } from "@project-serum/anchor";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import type { PublicKey } from "@solana/web3.js";

import { stakePool } from "./";

export const findStakeEntryId = (
  stakePoolId: PublicKey,
  mintId: PublicKey
): PublicKey => {
  return findProgramAddressSync(
    [
      utils.bytes.utf8.encode("stake-entry"),
      stakePoolId.toBuffer(),
      mintId.toBuffer(),
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

export const findUserEscrowId = (user: PublicKey): PublicKey => {
  return findProgramAddressSync(
    [utils.bytes.utf8.encode("escrow"), user.toBuffer()],
    stakePool.PROGRAM_ID
  )[0];
};
