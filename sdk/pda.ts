import type { BN } from "@project-serum/anchor";
import { utils } from "@project-serum/anchor";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import type { PublicKey } from "@solana/web3.js";

import { PROGRAM_ID } from "./generated/stakePool";

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
    PROGRAM_ID
  )[0];
};

export const findStakePoolId = (identifier: BN): PublicKey => {
  return findProgramAddressSync(
    [
      utils.bytes.utf8.encode("stake-pool"),
      identifier.toArrayLike(Buffer, "le", 8),
    ],
    PROGRAM_ID
  )[0];
};

export const findUserEscrowId = (user: PublicKey): PublicKey => {
  return findProgramAddressSync(
    [utils.bytes.utf8.encode("escrow"), user.toBuffer()],
    PROGRAM_ID
  )[0];
};

/**
 * Finds the identifier id.
 * @returns
 */
export const findIdentifierId = (): PublicKey => {
  return findProgramAddressSync(
    [utils.bytes.utf8.encode("identifier")],
    PROGRAM_ID
  )[0];
};
