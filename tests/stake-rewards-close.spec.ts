import { findAta, tryGetAccount } from "@cardinal/common";
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

import { createStakePool, initializeRewardEntry, stake, unstake } from "../src";
import { RewardDistributorKind } from "../src/programs/rewardDistributor";
import {
  getRewardDistributor,
  getRewardEntry,
} from "../src/programs/rewardDistributor/accounts";
import {
  findRewardDistributorId,
  findRewardEntryId,
} from "../src/programs/rewardDistributor/pda";
import {
  withCloseRewardDistributor,
  withCloseRewardEntry,
  withInitRewardDistributor,
} from "../src/programs/rewardDistributor/transaction";
import { ReceiptType } from "../src/programs/stakePool";
import { getStakeEntry } from "../src/programs/stakePool/accounts";
import { findStakeEntryIdFromMint } from "../src/programs/stakePool/utils";
import { createMasterEditionIxs, createMint, delay } from "./utils";
import { getProvider } from "./workspace";

describe("Stake claim rewards and close", () => {
  const maxSupply = 100;
  let originalMintTokenAccountId: PublicKey;
  let originalMint: splToken.Token;
  let rewardMint: splToken.Token;
  let stakePoolId: PublicKey;
  const originalMintAuthority = Keypair.generate();

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
      originalMintAuthority,
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

    await withInitRewardDistributor(
      transaction,
      provider.connection,
      provider.wallet,
      {
        stakePoolId: stakePoolId,
        rewardMintId: rewardMint.publicKey,
        kind: RewardDistributorKind.Treasury,
        maxSupply: new BN(maxSupply),
      }
    );

    const txEnvelope = new TransactionEnvelope(SolanaProvider.init(provider), [
      ...transaction.instructions,
    ]);

    await expectTXTable(
      txEnvelope,
      "Create reward distributor and reward entry",
      {
        verbosity: "error",
        formatLogs: true,
      }
    ).to.be.fulfilled;

    const [rewardDistributorId] = await findRewardDistributorId(stakePoolId);
    const rewardDistributorData = await getRewardDistributor(
      provider.connection,
      rewardDistributorId
    );

    expect(rewardDistributorData.parsed.rewardMint.toString()).to.eq(
      rewardMint.publicKey.toString()
    );

    expect(rewardDistributorData.parsed.rewardMint.toString()).to.eq(
      rewardMint.publicKey.toString()
    );
  });

  it("Create Reward Entry", async () => {
    const provider = getProvider();

    const [rewardDistributorId] = await findRewardDistributorId(stakePoolId);
    const [stakeEntryId] = await findStakeEntryIdFromMint(
      provider.connection,
      provider.wallet.publicKey,
      stakePoolId,
      originalMint.publicKey
    );

    const transaction = await initializeRewardEntry(
      provider.connection,
      provider.wallet,
      {
        originalMintId: originalMint.publicKey,
        stakePoolId: stakePoolId,
      }
    );

    const txEnvelope = new TransactionEnvelope(SolanaProvider.init(provider), [
      ...transaction.instructions,
    ]);

    await expectTXTable(
      txEnvelope,
      "Create reward distributor and reward entry",
      {
        verbosity: "error",
        formatLogs: true,
      }
    ).to.be.fulfilled;

    const [rewardEntryId] = await findRewardEntryId(
      rewardDistributorId,
      stakeEntryId
    );

    const rewardEntryData = await getRewardEntry(
      provider.connection,
      rewardEntryId
    );

    expect(rewardEntryData.parsed.rewardDistributor.toString()).to.eq(
      rewardDistributorId.toString()
    );

    expect(rewardEntryData.parsed.stakeEntry.toString()).to.eq(
      stakeEntryId.toString()
    );

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

    expect(stakeEntryData.parsed.originalMint.toString()).to.eq(
      originalMint.publicKey.toString()
    );
    expect(stakeEntryData.parsed.pool.toString()).to.eq(stakePoolId.toString());
    expect(stakeEntryData.parsed.stakeMint).to.eq(null);
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

    const userOriginalMintTokenAccountId = await findAta(
      originalMint.publicKey,
      provider.wallet.publicKey,
      true
    );

    expect(stakeEntryData.parsed.lastStakedAt.toNumber()).to.be.greaterThan(0);
    expect(stakeEntryData.parsed.lastStaker.toString()).to.eq(
      provider.wallet.publicKey.toString()
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
      (
        await findStakeEntryIdFromMint(
          provider.connection,
          provider.wallet.publicKey,
          stakePoolId,
          originalMint.publicKey
        )
      )[0]
    );
    expect(stakeEntryData.parsed.lastStaker.toString()).to.eq(
      PublicKey.default.toString()
    );
    expect(stakeEntryData.parsed.lastStakedAt.toNumber()).to.gt(0);

    const userOriginalMintTokenAccountId = await findAta(
      originalMint.publicKey,
      provider.wallet.publicKey,
      true
    );
    const checkUserOriginalTokenAccount = await originalMint.getAccountInfo(
      userOriginalMintTokenAccountId
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
    expect(checkUserRewardTokenAccount.amount.toNumber()).greaterThan(1);
  });

  it("Close reward entry", async () => {
    const provider = getProvider();
    const transaction = new Transaction();

    const [stakeEntryId] = await findStakeEntryIdFromMint(
      provider.connection,
      provider.wallet.publicKey,
      stakePoolId,
      originalMint.publicKey
    );
    await withCloseRewardEntry(
      transaction,
      provider.connection,
      provider.wallet,
      {
        stakePoolId: stakePoolId,
        stakeEntryId: stakeEntryId,
      }
    );
    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...transaction.instructions,
      ]),
      "Close reward entry"
    ).to.be.fulfilled;

    const [rewardDistributorId] = await findRewardDistributorId(stakePoolId);
    const [rewardEntryId] = await findRewardEntryId(
      rewardDistributorId,
      originalMint.publicKey
    );

    const rewardEntryData = await tryGetAccount(() =>
      getRewardEntry(provider.connection, rewardEntryId)
    );

    expect(rewardEntryData).to.eq(null);
  });

  it("Close reward distributor", async () => {
    await delay(2000);
    const provider = getProvider();
    const transaction = new Transaction();
    await withCloseRewardDistributor(
      transaction,
      provider.connection,
      provider.wallet,
      {
        stakePoolId: stakePoolId,
      }
    );
    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...transaction.instructions,
      ]),
      "Close reward distributor"
    ).to.be.fulfilled;

    const [rewardDistributorId] = await findRewardDistributorId(stakePoolId);
    const rewardDistributorData = await tryGetAccount(() =>
      getRewardDistributor(provider.connection, rewardDistributorId)
    );

    expect(rewardDistributorData).to.eq(null);
  });
});
