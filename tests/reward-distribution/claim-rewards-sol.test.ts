import { withFindOrInitAssociatedTokenAccount } from "@cardinal/common";
import { beforeAll, expect, test } from "@jest/globals";
import {
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import type { PublicKey } from "@solana/web3.js";
import { Keypair, LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";
import { BN } from "bn.js";

import {
  CLAIM_REWARDS_PAYMENT_INFO,
  claimRewards,
  findRewardDistributorId,
  findRewardEntryId,
  findStakeEntryId,
  findStakePoolId,
  SOL_PAYMENT_INFO,
  stake,
} from "../../sdk";
import {
  createInitPoolInstruction,
  createInitRewardDistributorInstruction,
  RewardDistributor,
  RewardEntry,
  StakeEntry,
  StakePool,
} from "../../sdk/generated";
import type { CardinalProvider } from "../utils";
import {
  createMasterEditionTx,
  createMintTx,
  executeTransaction,
  executeTransactions,
  getProvider,
} from "../utils";

const stakePoolIdentifier = `test-${Math.random()}`;
let provider: CardinalProvider;
const REWARD_SUPPLY = 100;
const REWARD_SECONDS = 1;
const REWARD_AMOUNT = 2;
let mintId: PublicKey;
let rewardMintId: PublicKey;

const PAYMENT_AMOUNT = 0.002 * LAMPORTS_PER_SOL;

beforeAll(async () => {
  provider = await getProvider();
  const mintKeypair = Keypair.generate();
  mintId = mintKeypair.publicKey;
  const mintTx = await createMasterEditionTx(
    provider.connection,
    mintKeypair.publicKey,
    provider.wallet.publicKey
  );

  const rewardMintKeypair = Keypair.generate();
  rewardMintId = rewardMintKeypair.publicKey;
  const rewardMintTx = await createMintTx(
    provider.connection,
    rewardMintId,
    provider.wallet.publicKey,
    { amount: REWARD_SUPPLY }
  );
  await executeTransaction(
    provider.connection,
    new Transaction().add(...mintTx.instructions, ...rewardMintTx.instructions),
    provider.wallet,
    { signers: [mintKeypair, rewardMintKeypair] }
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

test("Init reward distributor", async () => {
  const tx = new Transaction();
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const rewardDistributorId = findRewardDistributorId(stakePoolId);
  tx.add(
    createInitRewardDistributorInstruction(
      {
        rewardDistributor: rewardDistributorId,
        stakePool: stakePoolId,
        rewardMint: rewardMintId,
        authority: provider.wallet.publicKey,
        payer: provider.wallet.publicKey,
      },
      {
        ix: {
          identifier: new BN(0),
          rewardAmount: REWARD_AMOUNT,
          rewardDurationSeconds: REWARD_SECONDS,
          supply: null,
          defaultMultiplier: 1,
          multiplierDecimals: 0,
          maxRewardSecondsReceived: null,
          claimRewardsPaymentInfo: CLAIM_REWARDS_PAYMENT_INFO,
        },
      }
    )
  );

  const userRewardMintAta = getAssociatedTokenAddressSync(
    rewardMintId,
    provider.wallet.publicKey
  );
  const rewardDistributorAtaId = await withFindOrInitAssociatedTokenAccount(
    tx,
    provider.connection,
    rewardMintId,
    rewardDistributorId,
    provider.wallet.publicKey,
    true
  );

  tx.add(
    createTransferInstruction(
      userRewardMintAta,
      rewardDistributorAtaId,
      provider.wallet.publicKey,
      REWARD_SUPPLY
    )
  );
  await executeTransaction(provider.connection, tx, provider.wallet);
  const rewardDistributor = await RewardDistributor.fromAccountAddress(
    provider.connection,
    rewardDistributorId
  );
  expect(rewardDistributor.authority.toString()).toBe(
    provider.wallet.publicKey.toString()
  );
  expect(rewardDistributor.rewardMint.toString()).toBe(rewardMintId.toString());
  expect(rewardDistributor.multiplierDecimals).toBe(0);
  expect(Number(rewardDistributor.defaultMultiplier)).toBe(1);

  // reward account check
  const rewardDistributorAta = await getAccount(
    provider.connection,
    rewardDistributorAtaId
  );
  const amountAfter = Number(rewardDistributorAta.amount);
  expect(amountAfter).toBe(REWARD_SUPPLY);
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

test("Claim rewards", async () => {
  await new Promise((r) => setTimeout(r, 4000));
  const rewardDistributorId = findRewardDistributorId(
    findStakePoolId(stakePoolIdentifier)
  );

  // reward ata
  const userRewardAtaBefore = await getAccount(
    provider.connection,
    getAssociatedTokenAddressSync(rewardMintId, provider.wallet.publicKey)
  );
  const amountBefore = Number(userRewardAtaBefore.amount);
  expect(amountBefore).toBe(0);

  // balance before
  const balanceBefore = await provider.connection.getBalance(
    provider.wallet.publicKey
  );
  await executeTransactions(
    provider.connection,
    await claimRewards(
      provider.connection,
      provider.wallet,
      stakePoolIdentifier,
      [{ mintId }],
      [rewardDistributorId]
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

  // check reward entry
  const rewardEntryId = findRewardEntryId(rewardDistributorId, stakeEntryId);
  const rewardEntry = await RewardEntry.fromAccountAddress(
    provider.connection,
    rewardEntryId
  );
  expect(rewardEntry.stakeEntry.toString()).toBe(stakeEntryId.toString());
  expect(rewardEntry.rewardDistributor.toString()).toBe(
    rewardDistributorId.toString()
  );
  expect(Number(rewardEntry.rewardSecondsReceived)).toBeGreaterThan(0);

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

  // check rewards
  const userRewardAtaAfter = await getAccount(
    provider.connection,
    getAssociatedTokenAddressSync(rewardMintId, provider.wallet.publicKey)
  );
  const amountAfter = Number(userRewardAtaAfter.amount);
  expect(Number(userRewardAtaAfter.amount)).toBeGreaterThanOrEqual(8);

  // check reward distributor ata
  const rewardDistributorAtaAfter = await getAccount(
    provider.connection,
    getAssociatedTokenAddressSync(rewardMintId, rewardDistributorId, true)
  );
  const rewardDistributorAfter = Number(rewardDistributorAtaAfter.amount);
  expect(rewardDistributorAfter).toBe(REWARD_SUPPLY - amountAfter);

  // check payment payment ata
  const balanceAfter = await provider.connection.getBalance(
    provider.wallet.publicKey
  );
  expect(balanceBefore - PAYMENT_AMOUNT).toBeGreaterThan(balanceAfter);
});
