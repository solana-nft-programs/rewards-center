import {
  createInitMintManagerInstruction,
  DEFAULT_REQUIRED_CREATOR,
  findMintManagerId,
  findRulesetId,
} from "@cardinal/creator-standard";
import {
  createCreateMasterEditionV3Instruction,
  createCreateMetadataAccountV2Instruction,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createAssociatedTokenAccountInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type { Connection } from "@solana/web3.js";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

import { findMintEditionId, findMintMetadataId } from "../sdk/utils";

export const createMasterEditionTx = async (
  connection: Connection,
  mintId: PublicKey,
  authority: PublicKey,
  target = authority
) => {
  const ata = getAssociatedTokenAddressSync(mintId, target);
  const editionId = findMintEditionId(mintId);
  const metadataId = findMintMetadataId(mintId);

  return new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: authority,
      newAccountPubkey: mintId,
      space: MINT_SIZE,
      lamports: await getMinimumBalanceForRentExemptMint(connection),
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMint2Instruction(mintId, 0, authority, authority),
    createAssociatedTokenAccountInstruction(authority, ata, target, mintId),
    createMintToInstruction(mintId, ata, authority, 1),
    createCreateMetadataAccountV2Instruction(
      {
        metadata: metadataId,
        mint: mintId,
        updateAuthority: authority,
        mintAuthority: authority,
        payer: authority,
      },
      {
        createMetadataAccountArgsV2: {
          data: {
            name: `name-${Math.random()}`,
            symbol: "SYMB",
            uri: `uri-${Math.random()}`,
            sellerFeeBasisPoints: 0,
            creators: [{ address: authority, share: 100, verified: true }],
            collection: null,
            uses: null,
          },
          isMutable: true,
        },
      }
    ),
    createCreateMasterEditionV3Instruction(
      {
        edition: editionId,
        mint: mintId,
        updateAuthority: authority,
        mintAuthority: authority,
        metadata: metadataId,
        payer: authority,
      },
      { createMasterEditionArgs: { maxSupply: 0 } }
    )
  );
};

export const createCCSTokenTx = async (
  connection: Connection,
  mintId: PublicKey,
  authority: PublicKey,
  target = authority
) => {
  const ata = getAssociatedTokenAddressSync(mintId, target);
  const metadataId = findMintMetadataId(mintId);

  return new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: authority,
      newAccountPubkey: mintId,
      space: MINT_SIZE,
      lamports: await getMinimumBalanceForRentExemptMint(connection),
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMint2Instruction(mintId, 0, authority, authority),
    createAssociatedTokenAccountInstruction(authority, ata, target, mintId),
    createMintToInstruction(mintId, ata, authority, 1),
    createCreateMetadataAccountV2Instruction(
      {
        metadata: metadataId,
        mint: mintId,
        updateAuthority: authority,
        mintAuthority: authority,
        payer: authority,
      },
      {
        createMetadataAccountArgsV2: {
          data: {
            name: `name-${Math.random()}`,
            symbol: "SYMB",
            uri: `uri-${Math.random()}`,
            sellerFeeBasisPoints: 0,
            creators: [
              { address: authority, share: 50, verified: true },
              {
                address: new PublicKey(DEFAULT_REQUIRED_CREATOR),
                share: 50,
                verified: false,
              },
            ],
            collection: null,
            uses: null,
          },
          isMutable: true,
        },
      }
    ),
    createInitMintManagerInstruction({
      mint: mintId,
      mintManager: findMintManagerId(mintId),
      mintMetadata: metadataId,
      ruleset: findRulesetId(),
      holderTokenAccount: ata,
      tokenAuthority: authority,
      authority: authority,
      payer: authority,
    })
  );
};
