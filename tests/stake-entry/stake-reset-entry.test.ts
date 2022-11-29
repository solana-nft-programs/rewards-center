import { beforeAll, expect, test } from "@jest/globals";
import { Wallet } from "@project-serum/anchor";
import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import type { PublicKey } from "@solana/web3.js";
import { Keypair, Transaction } from "@solana/web3.js";

import {
  findStakeEntryId,
  findStakePoolId,
  SOL_PAYMENT_INFO,
  stake,
} from "../../sdk";
import {
  createInitPoolInstruction,
  createResetStakeEntryInstruction,
  StakeEntry,
  StakePool,
} from "../../sdk/generated";
import type { CardinalProvider } from "../utils";
import {
  createMasterEditionTx,
  executeTransaction,
  executeTransactions,
  getProvider,
  newAccountWithLamports,
} from "../utils";

const stakePoolIdentifier = `test-${Math.random()}`;
let provider: CardinalProvider;
let mintId: PublicKey;
let nonAuthority: Keypair;

beforeAll(async () => {
  provider = await getProvider();
  const mintKeypair = Keypair.generate();
  mintId = mintKeypair.publicKey;
  nonAuthority = await newAccountWithLamports(provider.connection);
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

test("Reset fail", async () => {
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeEntryId = findStakeEntryId(stakePoolId, mintId);
  await expect(
    executeTransaction(
      provider.connection,
      new Transaction().add(
        createResetStakeEntryInstruction({
          stakePool: stakePoolId,
          stakeEntry: stakeEntryId,
          authority: nonAuthority.publicKey,
        })
      ),
      new Wallet(nonAuthority),
      { silent: true }
    )
  ).rejects.toThrow();
});

test("Reset stake entry", async () => {
  await new Promise((r) => setTimeout(r, 2000));
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeEntryId = findStakeEntryId(stakePoolId, mintId);
  const stakeEntry = await StakeEntry.fromAccountAddress(
    provider.connection,
    stakeEntryId
  );

  await executeTransaction(
    provider.connection,
    new Transaction().add(
      createResetStakeEntryInstruction({
        stakePool: stakePoolId,
        stakeEntry: stakeEntryId,
        authority: provider.wallet.publicKey,
      })
    ),
    provider.wallet,
    { silent: true }
  );

  const userAtaId = getAssociatedTokenAddressSync(
    mintId,
    provider.wallet.publicKey
  );
  const checkEntry = await StakeEntry.fromAccountAddress(
    provider.connection,
    stakeEntryId
  );
  expect(checkEntry.stakeMint.toString()).toBe(mintId.toString());
  expect(checkEntry.lastStaker.toString()).toBe(
    provider.wallet.publicKey.toString()
  );
  expect(parseInt(checkEntry.lastStakedAt.toString())).toBeGreaterThan(
    parseInt(stakeEntry.lastStakedAt.toString())
  );
  expect(parseInt(checkEntry.lastUpdatedAt.toString())).toBeGreaterThan(
    parseInt(stakeEntry.lastUpdatedAt.toString())
  );
  expect(checkEntry.cooldownStartSeconds).toBe(null);

  const userAta = await getAccount(provider.connection, userAtaId);
  expect(userAta.isFrozen).toBe(true);
  expect(parseInt(userAta.amount.toString())).toBe(1);
  const activeStakeEntries = await StakeEntry.gpaBuilder()
    .addFilter("lastStaker", provider.wallet.publicKey)
    .run(provider.connection);
  expect(activeStakeEntries.length).toBe(1);
});
