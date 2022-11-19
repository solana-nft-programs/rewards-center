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
  claimRewardReceipt,
  DEFAULT_PAYMENT_INFO,
  findReceiptManagerId,
  findRewardReceiptId,
  findStakeEntryId,
  findStakePoolId,
  stake,
} from "../../sdk";
import {
  createInitPoolInstruction,
  createInitReceiptManagerInstruction,
  ReceiptManager,
  RewardReceipt,
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
const RECEIPT_MANAGER_IDENTIFIER = "receipt-manager-1";
const STARTING_AMOUNT = 100;
const PAYMENT_AMOUNT = 10;
const STAKE_SECONDS_TO_USE = 2;
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
    { signers: [mintKeypair] }
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
          stakePaymentInfo: DEFAULT_PAYMENT_INFO,
          unstakePaymentInfo: DEFAULT_PAYMENT_INFO,
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

test("Create receipt manager", async () => {
  const tx = new Transaction();
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const receiptManagerId = findReceiptManagerId(
    stakePoolId,
    RECEIPT_MANAGER_IDENTIFIER
  );
  tx.add(
    createInitReceiptManagerInstruction(
      {
        receiptManager: receiptManagerId,
        stakePool: stakePoolId,
        payer: provider.wallet.publicKey,
      },
      {
        ix: {
          name: RECEIPT_MANAGER_IDENTIFIER,
          authority: provider.wallet.publicKey,
          requiredStakeSeconds: 0,
          stakeSecondsToUse: STAKE_SECONDS_TO_USE,
          paymentMint: paymentMintId,
          paymentAmount: PAYMENT_AMOUNT,
          paymentShares: [{ address: paymentRecipientId, basisPoints: 10000 }],
          requiresAuthorization: false,
          maxClaimedReceipts: null,
          claimActionPaymentInfo: DEFAULT_PAYMENT_INFO,
        },
      }
    )
  );
  await executeTransaction(provider.connection, tx, provider.wallet);
  const receiptManager = await ReceiptManager.fromAccountAddress(
    provider.connection,
    receiptManagerId
  );
  expect(receiptManager.authority.toString()).toBe(
    provider.wallet.publicKey.toString()
  );
  expect(receiptManager.paymentMint.toString()).toBe(paymentMintId.toString());
  expect(receiptManager.requiresAuthorization).toBe(false);
  expect(receiptManager.stakeSecondsToUse.toString()).toBe(
    STAKE_SECONDS_TO_USE.toString()
  );
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

test("Claim receipt", async () => {
  await new Promise((r) => setTimeout(r, 4000));
  const receiptManagerId = findReceiptManagerId(
    findStakePoolId(stakePoolIdentifier),
    RECEIPT_MANAGER_IDENTIFIER
  );

  const userPaymentAta = await getAccount(
    provider.connection,
    getAssociatedTokenAddressSync(paymentMintId, provider.wallet.publicKey)
  );
  const amountBefore = Number(userPaymentAta.amount);
  expect(amountBefore).toBe(STARTING_AMOUNT);

  await executeTransaction(
    provider.connection,
    await claimRewardReceipt(
      provider.connection,
      provider.wallet,
      stakePoolIdentifier,
      { mintId },
      receiptManagerId
    ),
    provider.wallet
  );

  // check stake entry
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeEntryId = findStakeEntryId(stakePoolId, mintId);
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
  expect(parseInt(entry.totalStakeSeconds.toString())).toBeGreaterThan(1);
  expect(Number(entry.usedStakeSeconds)).toBe(STAKE_SECONDS_TO_USE);

  // check reward receipt
  const rewardReceiptId = findRewardReceiptId(receiptManagerId, stakeEntryId);
  const rewardReceipt = await RewardReceipt.fromAccountAddress(
    provider.connection,
    rewardReceiptId
  );
  expect(rewardReceipt.stakeEntry.toString()).toBe(stakeEntryId.toString());
  expect(rewardReceipt.target.toString()).toBe(
    provider.wallet.publicKey.toString()
  );

  // check staked
  const userAtaId = getAssociatedTokenAddressSync(
    mintId,
    provider.wallet.publicKey
  );
  const userAta = await getAccount(provider.connection, userAtaId);
  expect(userAta.isFrozen).toBe(true);
  expect(parseInt(userAta.amount.toString())).toBe(1);
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
  expect(amountAfter).toBe(STARTING_AMOUNT - PAYMENT_AMOUNT);
});
