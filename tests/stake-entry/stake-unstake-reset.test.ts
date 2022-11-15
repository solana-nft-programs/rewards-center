import { beforeAll, expect, test } from "@jest/globals";
import * as tokenMetadata from "@metaplex-foundation/mpl-token-metadata";
import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import * as tokenMetadatV1 from "mpl-token-metadata-v1";

import {
  findStakeEntryId,
  findStakePoolId,
  findUserEscrowId,
  stakePool,
} from "../../sdk";
import type { CardinalProvider } from "../utils";
import {
  createMasterEditionTx,
  executeTransaction,
  getProvider,
} from "../utils";

const stakePoolIdentifier = `test-${Math.random()}`;
let provider: CardinalProvider;
let mintId: PublicKey;
beforeAll(async () => {
  provider = await getProvider();
  const mintKeypair = Keypair.generate();
  mintId = mintKeypair.publicKey;
  await executeTransaction(
    provider.connection,
    await createMasterEditionTx(
      provider.connection,
      mintKeypair.publicKey,
      provider.wallet.publicKey
    ),
    provider.wallet,
    [mintKeypair]
  );
});

test("Init pool", async () => {
  const tx = new Transaction();
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  tx.add(
    stakePool.createInitPoolInstruction(
      {
        stakePool: stakePoolId,
        payer: provider.wallet.publicKey,
      },
      {
        ix: {
          identifier: stakePoolIdentifier,
          requiresCollections: [],
          requiresCreators: [],
          requiresAuthorization: false,
          authority: provider.wallet.publicKey,
          resetOnUnstake: true,
          cooldownSeconds: null,
          minStakeSeconds: null,
          endDate: null,
          stakePaymentAmount: null,
          unstakePaymentAmount: null,
          paymentMint: null,
          paymentManager: null,
        },
      }
    )
  );
  await executeTransaction(provider.connection, tx, provider.wallet);
  const pool = await stakePool.StakePool.fromAccountAddress(
    provider.connection,
    stakePoolId
  );
  expect(pool.authority.toString()).toBe(provider.wallet.publicKey.toString());
  expect(pool.requiresAuthorization).toBe(false);
});

test("Init entry", async () => {
  const tx = new Transaction();
  const metadataId = await tokenMetadatV1.Metadata.getPDA(mintId);
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeEntryId = findStakeEntryId(stakePoolId, mintId);
  tx.add(
    stakePool.createInitEntryInstruction(
      {
        stakeEntry: stakeEntryId,
        stakePool: stakePoolId,
        stakeMint: mintId,
        stakeMintMetadata: metadataId,
        payer: provider.wallet.publicKey,
      },
      {
        user: provider.wallet.publicKey,
      }
    )
  );
  await executeTransaction(provider.connection, tx, provider.wallet);
  const entry = await stakePool.StakeEntry.fromAccountAddress(
    provider.connection,
    stakeEntryId
  );
  expect(entry.stakeMint.toString()).toBe(mintId.toString());
});

test("Stake", async () => {
  const tx = new Transaction();
  const editionId = await tokenMetadatV1.Edition.getPDA(mintId);
  const metadataId = await tokenMetadatV1.Metadata.getPDA(mintId);
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeEntryId = findStakeEntryId(stakePoolId, mintId);
  const userEscrowId = findUserEscrowId(stakePoolId, provider.wallet.publicKey);
  const userAtaId = getAssociatedTokenAddressSync(
    mintId,
    provider.wallet.publicKey
  );
  tx.add(
    stakePool.createStakeEditionInstruction(
      {
        stakeEntry: stakeEntryId,
        stakePool: stakePoolId,
        stakeMint: mintId,
        stakeMintEdition: editionId,
        stakeMintMetadata: metadataId,
        user: provider.wallet.publicKey,
        userEscrow: userEscrowId,
        userStakeMintTokenAccount: userAtaId,
        tokenMetadataProgram: tokenMetadata.PROGRAM_ID,
      },
      {
        amount: 1,
      }
    )
  );
  await executeTransaction(provider.connection, tx, provider.wallet);
  const entry = await stakePool.StakeEntry.fromAccountAddress(
    provider.connection,
    stakeEntryId
  );
  expect(entry.stakeMint.toString()).toBe(mintId.toString());
  expect(entry.lastStaker.toString()).toBe(
    provider.wallet.publicKey.toString()
  );
  expect(parseInt(entry.lastStakedAt.toString())).toBeGreaterThan(
    Date.now() / 1000 - 60
  );
  expect(parseInt(entry.lastUpdatedAt.toString())).toBeGreaterThan(
    Date.now() / 1000 - 60
  );

  const userAta = await getAccount(provider.connection, userAtaId);
  expect(userAta.isFrozen).toBe(true);
  expect(parseInt(userAta.amount.toString())).toBe(1);
});

test("Unstake", async () => {
  const tx = new Transaction();
  const editionId = await tokenMetadatV1.Edition.getPDA(mintId);
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeEntryId = findStakeEntryId(stakePoolId, mintId);
  const userEscrowId = findUserEscrowId(stakePoolId, provider.wallet.publicKey);
  const userAtaId = getAssociatedTokenAddressSync(
    mintId,
    provider.wallet.publicKey
  );
  tx.add(
    stakePool.createUnstakeEditionInstruction({
      stakeEntry: stakeEntryId,
      stakePool: stakePoolId,
      stakeMint: mintId,
      stakeMintEdition: editionId,
      user: provider.wallet.publicKey,
      userEscrow: userEscrowId,
      userStakeMintTokenAccount: userAtaId,
      tokenMetadataProgram: tokenMetadata.PROGRAM_ID,
    })
  );
  await executeTransaction(provider.connection, tx, provider.wallet);
  const entry = await stakePool.StakeEntry.fromAccountAddress(
    provider.connection,
    stakeEntryId
  );
  expect(entry.stakeMint.toString()).toBe(mintId.toString());
  expect(entry.lastStaker.toString()).toBe(PublicKey.default.toString());
  expect(parseInt(entry.lastStakedAt.toString())).toBeGreaterThan(
    Date.now() / 1000 - 60
  );
  expect(parseInt(entry.lastUpdatedAt.toString())).toBeGreaterThan(
    Date.now() / 1000 - 60
  );
  expect(parseInt(entry.totalStakeSeconds.toString())).toBe(0);
  const userAta = await getAccount(provider.connection, userAtaId);
  expect(userAta.isFrozen).toBe(false);
  expect(parseInt(userAta.amount.toString())).toBe(1);
});
