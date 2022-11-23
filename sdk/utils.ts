import { getMint } from "@solana/spl-token";
import type { Connection, PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";

import { findStakeEntryId } from "./pda";

/**
 * Convenience method to find the stake entry id from a mint
 * NOTE: This will lookup the mint on-chain to get the supply
 * @returns
 */
export const findStakeEntryIdFromMint = async (
  connection: Connection,
  user: PublicKey,
  stakePoolId: PublicKey,
  stakeMintId: PublicKey,
  isFungible?: boolean
): Promise<PublicKey> => {
  if (isFungible === undefined) {
    const mint = await getMint(connection, stakeMintId);
    const supply = new BN(mint.supply.toString());
    isFungible = supply.gt(new BN(1));
  }
  return findStakeEntryId(stakePoolId, stakeMintId, user, isFungible);
};
