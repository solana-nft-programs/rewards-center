import { utils } from "@coral-xyz/anchor";
import { findProgramAddressSync } from "@coral-xyz/anchor/dist/cjs/utils/pubkey";
import {
  PREFIX as TOKEN_AUTH_RULESET_PREFIX,
  PROGRAM_ID as TOKEN_AUTH_RULES_ID,
} from "@metaplex-foundation/mpl-token-auth-rules";
import { getMint } from "@solana/spl-token";
import type { Connection } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";

import { findStakeEntryId } from "./pda";

export const METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

/**
 * Convenience method to find the stake entry id from a mint
 * NOTE: This will lookup the mint on-chain to get the supply
 * @returns
 */
export const findStakeEntryIdFromMint = async (
  connection: Connection,
  stakePoolId: PublicKey,
  stakeMintId: PublicKey,
  user: PublicKey,
  isFungible?: boolean
): Promise<PublicKey> => {
  if (isFungible === undefined) {
    const mint = await getMint(connection, stakeMintId);
    const supply = new BN(mint.supply.toString());
    isFungible = supply.gt(new BN(1));
  }
  return findStakeEntryId(stakePoolId, stakeMintId, user, isFungible);
};

export const findMintMetadataId = (mintId: PublicKey): PublicKey => {
  return findProgramAddressSync(
    [
      utils.bytes.utf8.encode("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mintId.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  )[0];
};

export const findMintEditionId = (mintId: PublicKey): PublicKey => {
  return findProgramAddressSync(
    [
      utils.bytes.utf8.encode("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mintId.toBuffer(),
      utils.bytes.utf8.encode("edition"),
    ],
    METADATA_PROGRAM_ID
  )[0];
};

export function findTokenRecordId(
  mint: PublicKey,
  token: PublicKey
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("token_record"),
      token.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  )[0];
}

export const findRuleSetId = (authority: PublicKey, name: string) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(TOKEN_AUTH_RULESET_PREFIX),
      authority.toBuffer(),
      Buffer.from(name),
    ],
    TOKEN_AUTH_RULES_ID
  )[0];
};
