// blockasset setup
import { findAta } from "@cardinal/common";
import { expectTXTable } from "@saberhq/chai-solana";
import { SolanaProvider, TransactionEnvelope } from "@saberhq/solana-contrib";
import * as splToken from "@solana/spl-token";
import type { PublicKey } from "@solana/web3.js";
import { Keypair, Transaction } from "@solana/web3.js";
import { BN } from "bn.js";
import { expect } from "chai";

import {
  claimRewards,
  createStakePool,
  initializeRewardEntry,
  stake,
} from "../src";
import {
  getRewardDistributor,
  getRewardEntry,
} from "../src/programs/rewardDistributor/accounts";
import { updateRewardEntry } from "../src/programs/rewardDistributor/instruction";
import {
  findRewardDistributorId,
  findRewardEntryId,
} from "../src/programs/rewardDistributor/pda";
import { withInitRewardDistributor } from "../src/programs/rewardDistributor/transaction";
import { getStakeEntry } from "../src/programs/stakePool/accounts";
import { findStakeEntryIdFromMint } from "../src/programs/stakePool/utils";
import { createMint, delay } from "./utils";
import { getProvider } from "./workspace";

describe("Stake and claim rewards", () => {
  let originalMintTokenAccountId: PublicKey;
  let originalMint: splToken.Token;
  let rewardMint: splToken.Token;
  let stakePoolId: PublicKey;
  let rewardDistributorId: PublicKey;
  const originalMintAuthority = Keypair.generate();

  // fungible test that the amount and seconds should be zero
  before(async () => {
    const provider = getProvider();
    // original mint
    [originalMintTokenAccountId, originalMint] = await createMint(
      provider.connection,
      originalMintAuthority,
      provider.wallet.publicKey,
      1,
      originalMintAuthority.publicKey,
      originalMintAuthority.publicKey,
      6
    );

    // reward mint
    [, rewardMint] = await createMint(
      provider.connection,
      originalMintAuthority,
      provider.wallet.publicKey,
      0,
      provider.wallet.publicKey,
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
        rewardAmount: new BN((10 ** 6 / 24 / 60 / 60) * 1000),
        rewardDurationSeconds: new BN(1),
        supply: new BN(5 * 10 * 6),
        defaultMultiplier: new BN(1000),
        multiplierDecimals: 7,
      }
    );

    const txEnvelope = new TransactionEnvelope(SolanaProvider.init(provider), [
      ...transaction.instructions,
    ]);

    await expectTXTable(txEnvelope, "Create reward distributor", {
      verbosity: "error",
      formatLogs: true,
    }).to.be.fulfilled;

    [rewardDistributorId] = await findRewardDistributorId(stakePoolId);
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
        stakePoolId: stakePoolId,
        originalMintId: originalMint.publicKey,
      }
    );

    transaction.add(
      await updateRewardEntry(provider.connection, provider.wallet, {
        stakePoolId: stakePoolId,
        stakeEntryId: stakeEntryId,
        multiplier: new BN(12481),
      })
    );

    const txEnvelope = new TransactionEnvelope(SolanaProvider.init(provider), [
      ...transaction.instructions,
    ]);

    await expectTXTable(txEnvelope, "Create reward entry", {
      verbosity: "error",
      formatLogs: true,
    }).to.be.fulfilled;

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
    expect(checkUserOriginalTokenAccount.amount.toNumber()).to.eq(0);
  });

  it("Claim Rewards", async () => {
    await delay(4000);
    const provider = getProvider();
    const [stakeEntryId] = await findStakeEntryIdFromMint(
      provider.connection,
      provider.wallet.publicKey,
      stakePoolId,
      originalMint.publicKey
    );

    const [rewardEntryId] = await findRewardEntryId(
      rewardDistributorId,
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

    const userOriginalMintTokenAccountId = await findAta(
      originalMint.publicKey,
      provider.wallet.publicKey,
      true
    );
    const checkUserOriginalTokenAccount = await originalMint.getAccountInfo(
      userOriginalMintTokenAccountId
    );
    expect(checkUserOriginalTokenAccount.amount.toNumber()).to.eq(0);

    const rewardEntryAfter = await getRewardEntry(
      provider.connection,
      rewardEntryId
    );

    const userRewardMintTokenAccount = await findAta(
      rewardMint.publicKey,
      provider.wallet.publicKey,
      true
    );
    const checkMint = new splToken.Token(
      provider.connection,
      rewardMint.publicKey,
      splToken.TOKEN_PROGRAM_ID,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      null
    );
    const rewardDistributorData = await getRewardDistributor(
      provider.connection,
      rewardDistributorId
    );
    const a = await checkMint.getAccountInfo(userRewardMintTokenAccount);
    console.log("user reward mint token acount", a.amount.toNumber());
    console.log(
      "rewardsIssued",
      rewardDistributorData.parsed.rewardsIssued.toNumber()
    );

    expect(rewardEntryAfter.parsed.rewardSecondsReceived.toNumber()).to.gt(0);
  });
});
