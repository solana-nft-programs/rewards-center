import { findAta } from "@cardinal/common";
import { BN } from "@project-serum/anchor";
import { expectTXTable } from "@saberhq/chai-solana";
import {
  SignerWallet,
  SolanaProvider,
  TransactionEnvelope,
} from "@saberhq/solana-contrib";
import type * as splToken from "@solana/spl-token";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { expect } from "chai";

import {
  claimRewards,
  createStakePool,
  rewardDistributor,
  stake,
  unstake,
} from "../src";
import { RewardDistributorKind } from "../src/programs/rewardDistributor";
import { getRewardDistributor } from "../src/programs/rewardDistributor/accounts";
import { findRewardDistributorId } from "../src/programs/rewardDistributor/pda";
import { ReceiptType } from "../src/programs/stakePool";
import { getStakeEntry } from "../src/programs/stakePool/accounts";
import { findStakeEntryIdFromMint } from "../src/programs/stakePool/utils";
import { createMasterEditionIxs, createMint, delay } from "./utils";
import { getProvider } from "./workspace";

describe("Stake and claim rewards up to max reward seconds", () => {
  let originalMintTokenAccountId: PublicKey;
  let originalMint: splToken.Token;
  let rewardMint: splToken.Token;
  let stakePoolId: PublicKey;

  const maxSupply = 100;
  const maxRewardSeconds = 1;
  const originalMintAuthority = Keypair.generate();
  const rewardMintAuthority = Keypair.generate();

  before(async () => {
    const provider = getProvider();
    // original mint
    [originalMintTokenAccountId, originalMint] = await createMint(
      provider.connection,
      originalMintAuthority,
      provider.wallet.publicKey,
      1,
      originalMintAuthority.publicKey
    );

    // master edition
    const ixs = await createMasterEditionIxs(
      originalMint.publicKey,
      originalMintAuthority.publicKey
    );
    const txEnvelope = new TransactionEnvelope(
      SolanaProvider.init({
        connection: provider.connection,
        wallet: new SignerWallet(originalMintAuthority),
        opts: provider.opts,
      }),
      ixs
    );
    await expectTXTable(txEnvelope, "before", {
      verbosity: "error",
      formatLogs: true,
    }).to.be.fulfilled;

    // reward mint
    [, rewardMint] = await createMint(
      provider.connection,
      rewardMintAuthority,
      provider.wallet.publicKey,
      maxSupply,
      provider.wallet.publicKey
    );
  });

  it("Create Pool", async () => {
    const provider = getProvider();

    let transaction: Transaction;
    [transaction, stakePoolId] = await createStakePool(
      provider.connection,
      provider.wallet,
      {}
    );

    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...transaction.instructions,
      ]),
      "Create pool"
    ).to.be.fulfilled;
  });

  it("Create Reward Distributor", async () => {
    const provider = getProvider();
    const transaction = new Transaction();
    await rewardDistributor.transaction.withInitRewardDistributor(
      transaction,
      provider.connection,
      provider.wallet,
      {
        stakePoolId: stakePoolId,
        rewardMintId: rewardMint.publicKey,
        kind: RewardDistributorKind.Treasury,
        maxSupply: new BN(maxSupply),
        rewardAmount: new BN(1),
        rewardDurationSeconds: new BN(1),
        maxRewardSecondsReceived: new BN(maxRewardSeconds),
      }
    );

    const txEnvelope = new TransactionEnvelope(
      SolanaProvider.init({
        connection: provider.connection,
        wallet: provider.wallet,
        opts: provider.opts,
      }),
      [...transaction.instructions]
    );

    await expectTXTable(txEnvelope, "Create reward distributor", {
      verbosity: "error",
      formatLogs: true,
    }).to.be.fulfilled;

    const [rewardDistributorId] = await findRewardDistributorId(stakePoolId);
    const rewardDistributorData = await getRewardDistributor(
      provider.connection,
      rewardDistributorId
    );

    expect(rewardDistributorData.parsed.rewardMint.toString()).to.eq(
      rewardMint.publicKey.toString()
    );

    const checkRewardDistributorTokenAccount = await rewardMint.getAccountInfo(
      await findAta(rewardMint.publicKey, rewardDistributorId, true)
    );
    expect(checkRewardDistributorTokenAccount.amount.toNumber()).eq(maxSupply);
  });

  it("Stake", async () => {
    const provider = getProvider();

    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...(
          await stake(provider.connection, provider.wallet, {
            stakePoolId: stakePoolId,
            originalMintId: originalMint.publicKey,
            userOriginalMintTokenAccountId: originalMintTokenAccountId,
            receiptType: ReceiptType.Original,
          })
        ).instructions,
      ]),
      "Stake"
    ).to.be.fulfilled;

    const stakeEntryData = await getStakeEntry(
      provider.connection,
      (
        await findStakeEntryIdFromMint(
          provider.connection,
          provider.wallet.publicKey,
          stakePoolId,
          originalMint.publicKey
        )
      )[0]
    );

    expect(stakeEntryData.parsed.lastStakedAt.toNumber()).to.be.greaterThan(0);
    expect(stakeEntryData.parsed.lastStaker.toString()).to.eq(
      provider.wallet.publicKey.toString()
    );

    const checkUserOriginalTokenAccount = await originalMint.getAccountInfo(
      await findAta(originalMint.publicKey, provider.wallet.publicKey, true)
    );
    expect(checkUserOriginalTokenAccount.amount.toNumber()).to.eq(1);
    expect(checkUserOriginalTokenAccount.isFrozen).to.eq(true);
  });

  it("Claim Rewards", async () => {
    await delay(3000);
    const provider = getProvider();
    const [stakeEntryId] = await findStakeEntryIdFromMint(
      provider.connection,
      provider.wallet.publicKey,
      stakePoolId,
      originalMint.publicKey
    );
    const oldStakeEntryData = await getStakeEntry(
      provider.connection,
      stakeEntryId
    );

    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...(
          await claimRewards(provider.connection, provider.wallet, {
            stakePoolId: stakePoolId,
            stakeEntryId: stakeEntryId,
          })
        ).instructions,
      ]),
      "Claim Rewards"
    ).to.be.fulfilled;

    const newStakeEntryData = await getStakeEntry(
      provider.connection,
      stakeEntryId
    );
    expect(newStakeEntryData.parsed.lastStaker.toString()).to.eq(
      provider.wallet.publicKey.toString()
    );
    expect(newStakeEntryData.parsed.lastStakedAt.toNumber()).to.gt(
      oldStakeEntryData.parsed.lastStakedAt.toNumber()
    );
    expect(newStakeEntryData.parsed.totalStakeSeconds.toNumber()).to.gt(
      oldStakeEntryData.parsed.totalStakeSeconds.toNumber()
    );

    const userRewardMintTokenAccountId = await findAta(
      rewardMint.publicKey,
      provider.wallet.publicKey,
      true
    );

    const checkUserRewardTokenAccount = await rewardMint.getAccountInfo(
      userRewardMintTokenAccountId
    );
    expect(checkUserRewardTokenAccount.amount.toNumber()).eq(maxRewardSeconds);

    const userOriginalMintTokenAccountId = await findAta(
      originalMint.publicKey,
      provider.wallet.publicKey,
      true
    );
    const checkUserOriginalTokenAccount = await originalMint.getAccountInfo(
      userOriginalMintTokenAccountId
    );
    expect(checkUserOriginalTokenAccount.amount.toNumber()).to.eq(1);
    expect(checkUserOriginalTokenAccount.isFrozen).to.eq(true);
  });

  it("Claim Rewards again", async () => {
    await delay(2000);
    const provider = getProvider();
    const [stakeEntryId] = await findStakeEntryIdFromMint(
      provider.connection,
      provider.wallet.publicKey,
      stakePoolId,
      originalMint.publicKey
    );
    const oldStakeEntryData = await getStakeEntry(
      provider.connection,
      stakeEntryId
    );

    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...(
          await claimRewards(provider.connection, provider.wallet, {
            stakePoolId: stakePoolId,
            stakeEntryId: stakeEntryId,
          })
        ).instructions,
      ]),
      "Claim Rewards"
    ).to.be.fulfilled;

    const newStakeEntryData = await getStakeEntry(
      provider.connection,
      stakeEntryId
    );
    expect(newStakeEntryData.parsed.lastStaker.toString()).to.eq(
      provider.wallet.publicKey.toString()
    );
    expect(newStakeEntryData.parsed.lastStakedAt.toNumber()).to.gt(
      oldStakeEntryData.parsed.lastStakedAt.toNumber()
    );
    expect(newStakeEntryData.parsed.totalStakeSeconds.toNumber()).to.gt(
      oldStakeEntryData.parsed.totalStakeSeconds.toNumber()
    );

    const userRewardMintTokenAccountId = await findAta(
      rewardMint.publicKey,
      provider.wallet.publicKey,
      true
    );

    const checkUserRewardTokenAccount = await rewardMint.getAccountInfo(
      userRewardMintTokenAccountId
    );
    expect(checkUserRewardTokenAccount.amount.toNumber()).eq(maxRewardSeconds);

    const userOriginalMintTokenAccountId = await findAta(
      originalMint.publicKey,
      provider.wallet.publicKey,
      true
    );
    const checkUserOriginalTokenAccount = await originalMint.getAccountInfo(
      userOriginalMintTokenAccountId
    );
    expect(checkUserOriginalTokenAccount.amount.toNumber()).to.eq(1);
    expect(checkUserOriginalTokenAccount.isFrozen).to.eq(true);
  });

  it("Unstake", async () => {
    await delay(2000);
    const provider = getProvider();
    const [stakeEntryId] = await findStakeEntryIdFromMint(
      provider.connection,
      provider.wallet.publicKey,
      stakePoolId,
      originalMint.publicKey
    );

    const oldStakeEntryData = await getStakeEntry(
      provider.connection,
      stakeEntryId
    );
    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...(
          await unstake(provider.connection, provider.wallet, {
            stakePoolId: stakePoolId,
            originalMintId: originalMint.publicKey,
          })
        ).instructions,
      ]),
      "Unstake"
    ).to.be.fulfilled;

    const stakeEntryData = await getStakeEntry(
      provider.connection,
      stakeEntryId
    );
    expect(stakeEntryData.parsed.lastStaker.toString()).to.eq(
      PublicKey.default.toString()
    );
    expect(stakeEntryData.parsed.lastStakedAt.toNumber()).to.gt(0);

    const newStakeEntryData = await getStakeEntry(
      provider.connection,
      stakeEntryId
    );
    expect(newStakeEntryData.parsed.lastStaker.toString()).to.eq(
      PublicKey.default.toString()
    );
    expect(newStakeEntryData.parsed.totalStakeSeconds.toNumber()).to.gt(
      oldStakeEntryData.parsed.totalStakeSeconds.toNumber()
    );
    const checkUserOriginalTokenAccount = await originalMint.getAccountInfo(
      await findAta(originalMint.publicKey, provider.wallet.publicKey, true)
    );
    expect(checkUserOriginalTokenAccount.amount.toNumber()).to.eq(1);
    expect(checkUserOriginalTokenAccount.isFrozen).to.eq(false);

    const stakeEntryOriginalMintTokenAccountId = await findAta(
      originalMint.publicKey,
      stakeEntryData.pubkey,
      true
    );

    const userRewardMintTokenAccountId = await findAta(
      rewardMint.publicKey,
      provider.wallet.publicKey,
      true
    );

    const checkStakeEntryOriginalMintTokenAccount =
      await originalMint.getAccountInfo(stakeEntryOriginalMintTokenAccountId);
    expect(checkStakeEntryOriginalMintTokenAccount.amount.toNumber()).to.eq(0);

    const checkUserRewardTokenAccount = await rewardMint.getAccountInfo(
      userRewardMintTokenAccountId
    );
    expect(checkUserRewardTokenAccount.amount.toNumber()).eq(maxRewardSeconds);
  });
});
