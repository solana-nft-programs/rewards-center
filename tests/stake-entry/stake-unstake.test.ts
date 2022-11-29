import { beforeAll, expect, test } from "@jest/globals";
import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";

import {
  findStakeEntryId,
  findStakePoolId,
  SOL_PAYMENT_INFO,
  stake,
  unstake,
} from "../../sdk";
import {
  createInitPoolInstruction,
  StakeEntry,
  StakePool,
} from "../../sdk/generated";
import type { CardinalProvider } from "../utils";
import {
  createMasterEditionTx,
  executeTransaction,
  executeTransactions,
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
    { signers: [mintKeypair] }
  );
});

test("Init pool", async () => {
  const tx = new Transaction();
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  tx.add(
    createInitPoolInstruction(
      {
        stakePool: stakePoolId,
        payer: provider.wallet.publicKey,
      },
      {
        ix: {
          identifier: stakePoolIdentifier,
          allowedCollections: [],
          allowedCreators: [],
          requiresAuthorization: false,
          authority: provider.wallet.publicKey,
          resetOnUnstake: false,
          cooldownSeconds: null,
          minStakeSeconds: null,
          endDate: null,
          stakePaymentInfo: SOL_PAYMENT_INFO,
          unstakePaymentInfo: SOL_PAYMENT_INFO,
        },
      }
    )
  );
  await executeTransaction(provider.connection, tx, provider.wallet);
  const pool = await StakePool.fromAccountAddress(
    provider.connection,
    stakePoolId
  );
  expect(pool.authority.toString()).toBe(provider.wallet.publicKey.toString());
  expect(pool.requiresAuthorization).toBe(false);
});

test("Stake", async () => {
  await executeTransactions(
    provider.connection,
    await stake(provider.connection, provider.wallet, stakePoolIdentifier, [
      { mintId },
    ]),
    provider.wallet
  );

  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeEntryId = findStakeEntryId(stakePoolId, mintId);
  const userAtaId = getAssociatedTokenAddressSync(
    mintId,
    provider.wallet.publicKey
  );
  const entry = await StakeEntry.fromAccountAddress(
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
  const activeStakeEntries = await StakeEntry.gpaBuilder()
    .addFilter("lastStaker", provider.wallet.publicKey)
    .run(provider.connection);
  expect(activeStakeEntries.length).toBe(1);
});

test("Stake again fail", async () => {
  await expect(
    executeTransactions(
      provider.connection,
      await stake(provider.connection, provider.wallet, stakePoolIdentifier, [
        { mintId },
      ]),
      provider.wallet,
      { silent: true }
    )
  ).rejects.toThrow();
});

test("Unstake", async () => {
  await new Promise((r) => setTimeout(r, 2000));
  await executeTransactions(
    provider.connection,
    await unstake(provider.connection, provider.wallet, stakePoolIdentifier, [
      { mintId },
    ]),
    provider.wallet
  );

  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeEntryId = findStakeEntryId(stakePoolId, mintId);
  const userAtaId = getAssociatedTokenAddressSync(
    mintId,
    provider.wallet.publicKey
  );
  const entry = await StakeEntry.fromAccountAddress(
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
  expect(parseInt(entry.totalStakeSeconds.toString())).toBeGreaterThan(1);

  const userAta = await getAccount(provider.connection, userAtaId);
  expect(userAta.isFrozen).toBe(false);
  expect(parseInt(userAta.amount.toString())).toBe(1);
  const activeStakeEntries = await StakeEntry.gpaBuilder()
    .addFilter("lastStaker", provider.wallet.publicKey)
    .run(provider.connection);
  expect(activeStakeEntries.length).toBe(0);
});
