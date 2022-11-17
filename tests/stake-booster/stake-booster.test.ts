import { withWrapSol } from "@cardinal/common";
import { beforeAll, expect, test } from "@jest/globals";
import {
  getAccount,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
} from "@solana/spl-token";
import type { PublicKey } from "@solana/web3.js";
import { Keypair, Transaction } from "@solana/web3.js";

import {
  boost,
  findStakeBoosterId,
  findStakeEntryId,
  findStakePoolId,
  stake,
  STAKE_BOOSTER_PAYMENT_MANAGER_ID,
} from "../../sdk";
import {
  createInitPoolInstruction,
  createInitStakeBoosterInstruction,
  StakeBooster,
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
const STARTING_AMOUNT = 100;
const PAYMENT_AMOUNT = 10;
const STAKE_SECONDS_TO_BOOST = 2;
let mintId: PublicKey;
let paymentMintId: PublicKey;
let paymentRecipientId: PublicKey;

beforeAll(async () => {
  provider = await getProvider();
  const mintKeypair = Keypair.generate();
  mintId = mintKeypair.publicKey;
  const mintTx = await createMasterEditionTx(
    provider.connection,
    mintKeypair.publicKey,
    provider.wallet.publicKey
  );
  await executeTransaction(
    provider.connection,
    await withWrapSol(
      new Transaction().add(...mintTx.instructions),
      provider.connection,
      provider.wallet,
      STARTING_AMOUNT
    ),
    provider.wallet,
    [mintKeypair]
  );

  paymentMintId = NATIVE_MINT;
  paymentRecipientId = Keypair.generate().publicKey;
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
          stakePaymentAmount: null,
          unstakePaymentAmount: null,
          paymentMint: null,
          paymentManager: null,
          paymentRecipient: null,
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

test("Create stake booster", async () => {
  const tx = new Transaction();
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeBoosterId = findStakeBoosterId(stakePoolId);
  tx.add(
    createInitStakeBoosterInstruction(
      {
        stakeBooster: stakeBoosterId,
        stakePool: stakePoolId,
        authority: provider.wallet.publicKey,
        payer: provider.wallet.publicKey,
      },
      {
        ix: {
          identifier: 0,
          stakePool: stakePoolId,
          paymentAmount: PAYMENT_AMOUNT,
          paymentMint: paymentMintId,
          paymentManager: STAKE_BOOSTER_PAYMENT_MANAGER_ID,
          paymentRecipient: paymentRecipientId,
          boostSeconds: 1,
          startTimeSeconds: Date.now() / 1000 - 1000,
        },
      }
    )
  );
  await executeTransaction(provider.connection, tx, provider.wallet);
  const stakeBooster = await StakeBooster.fromAccountAddress(
    provider.connection,
    stakeBoosterId
  );
  expect(stakeBooster.paymentMint.toString()).toBe(paymentMintId.toString());
  expect(Number(stakeBooster.boostSeconds)).toBe(1);
  expect(stakeBooster.paymentAmount.toString()).toBe(PAYMENT_AMOUNT.toString());
});

test("Stake", async () => {
  // miss 3 seconds
  await new Promise((r) => setTimeout(r, 3000));
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

test("Boost", async () => {
  await new Promise((r) => setTimeout(r, 1000));

  // check stake entry before
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeEntryId = findStakeEntryId(stakePoolId, mintId);
  const entryBefore = await StakeEntry.fromAccountAddress(
    provider.connection,
    stakeEntryId
  );
  expect(entryBefore.stakeMint.toString()).toBe(mintId.toString());
  expect(entryBefore.lastStaker.toString()).toBe(
    provider.wallet.publicKey.toString()
  );
  expect(parseInt(entryBefore.totalStakeSeconds.toString())).toBe(0);
  expect(parseInt(entryBefore.lastStakedAt.toString())).toBeGreaterThan(
    Date.now() / 1000 - 60
  );
  expect(parseInt(entryBefore.lastUpdatedAt.toString())).toBeGreaterThan(
    Date.now() / 1000 - 60
  );

  // check payment before
  const userPaymentAta = await getAccount(
    provider.connection,
    getAssociatedTokenAddressSync(paymentMintId, provider.wallet.publicKey)
  );
  const amountBefore = Number(userPaymentAta.amount);
  expect(amountBefore).toBe(STARTING_AMOUNT);

  await executeTransaction(
    provider.connection,
    await boost(
      provider.connection,
      provider.wallet,
      stakePoolIdentifier,
      {
        mintId,
      },
      STAKE_SECONDS_TO_BOOST
    ),
    provider.wallet
  );

  // check stake entry
  const entryAfter = await StakeEntry.fromAccountAddress(
    provider.connection,
    stakeEntryId
  );
  expect(Number(entryAfter.totalStakeSeconds)).toBeGreaterThanOrEqual(
    STAKE_SECONDS_TO_BOOST
  );
  expect(entryAfter.stakeMint.toString()).toBe(mintId.toString());
  expect(entryAfter.lastStaker.toString()).toBe(
    provider.wallet.publicKey.toString()
  );
  expect(Number(entryAfter.lastStakedAt)).toBeGreaterThan(
    Date.now() / 1000 - 60
  );
  expect(Number(entryAfter.lastUpdatedAt)).toBeGreaterThan(
    Date.now() / 1000 - 60
  );

  // check staked
  const userAtaId = getAssociatedTokenAddressSync(
    mintId,
    provider.wallet.publicKey
  );
  const userAta = await getAccount(provider.connection, userAtaId);
  expect(userAta.isFrozen).toBe(true);
  expect(Number(userAta.amount)).toBe(1);
  const activeStakeEntries = await StakeEntry.gpaBuilder()
    .addFilter("lastStaker", provider.wallet.publicKey)
    .run(provider.connection);
  expect(activeStakeEntries.length).toBe(1);

  // check payment
  const userPaymentAtaAfter = await getAccount(
    provider.connection,
    getAssociatedTokenAddressSync(paymentMintId, provider.wallet.publicKey)
  );
  const amountAfter = Number(userPaymentAtaAfter.amount);
  expect(amountAfter).toBe(
    STARTING_AMOUNT - PAYMENT_AMOUNT * STAKE_SECONDS_TO_BOOST
  );
});

test("Boost too far", async () => {
  await expect(
    executeTransaction(
      provider.connection,
      await boost(
        provider.connection,
        provider.wallet,
        stakePoolIdentifier,
        {
          mintId,
        },
        10000
      ),
      provider.wallet,
      [],
      true
    )
  ).rejects.toThrow();
});
