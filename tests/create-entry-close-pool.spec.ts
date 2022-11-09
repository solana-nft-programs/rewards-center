import { tryGetAccount } from "@cardinal/common";
import { expectTXTable } from "@saberhq/chai-solana";
import {
  SignerWallet,
  SolanaProvider,
  TransactionEnvelope,
} from "@saberhq/solana-contrib";
import type * as splToken from "@solana/spl-token";
import type { PublicKey } from "@solana/web3.js";
import { Keypair, Transaction } from "@solana/web3.js";
import { BN } from "bn.js";
import { expect } from "chai";

import { createStakeEntry, createStakePool, rewardDistributor } from "../src";
import { RewardDistributorKind } from "../src/programs/rewardDistributor";
import { getRewardDistributor } from "../src/programs/rewardDistributor/accounts";
import { findRewardDistributorId } from "../src/programs/rewardDistributor/pda";
import {
  getStakeEntry,
  getStakePool,
} from "../src/programs/stakePool/accounts";
import {
  withCloseStakeEntry,
  withCloseStakePool,
} from "../src/programs/stakePool/transaction";
import { findStakeEntryIdFromMint } from "../src/programs/stakePool/utils";
import { createMasterEditionIxs, createMint } from "./utils";
import { getProvider } from "./workspace";

describe("Stake and claim rewards", () => {
  let originalMint: splToken.Token;
  let rewardMint: splToken.Token;
  let stakePoolId: PublicKey;

  const maxSupply = 100;
  const originalMintAuthority = Keypair.generate();
  const rewardMintAuthority = Keypair.generate();

  before(async () => {
    const provider = getProvider();
    // original mint
    [, originalMint] = await createMint(
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
        defaultMultiplier: new BN(1),
        multiplierDecimals: 1,
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
    expect(rewardDistributorData.parsed.defaultMultiplier.toNumber()).to.eq(1);
    expect(rewardDistributorData.parsed.multiplierDecimals).to.eq(1);
  });

  it("Create Stake And Reward Entry", async () => {
    const provider = getProvider();

    const [rewardDistributorId] = await findRewardDistributorId(stakePoolId);
    const [transaction, stakeEntryId] = await createStakeEntry(
      provider.connection,
      provider.wallet,
      {
        stakePoolId: stakePoolId,
        originalMintId: originalMint.publicKey,
      }
    );
    await rewardDistributor.transaction.withInitRewardEntry(
      transaction,
      provider.connection,
      provider.wallet,
      {
        stakeEntryId: stakeEntryId,
        rewardDistributorId: rewardDistributorId,
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

    const rewardDistributorData = await getRewardDistributor(
      provider.connection,
      rewardDistributorId
    );
    expect(rewardDistributorData.parsed.defaultMultiplier.toNumber()).to.eq(1);
  });

  it("Fail close pool", () => {
    const provider = getProvider();
    const transaction = new Transaction();
    withCloseStakePool(transaction, provider.connection, provider.wallet, {
      stakePoolId: stakePoolId,
    });
    expect(async () => {
      await expectTXTable(
        new TransactionEnvelope(SolanaProvider.init(provider), [
          ...transaction.instructions,
        ]),
        "Fail close"
      ).to.be.rejectedWith(Error);
    });
  });

  it("Close entry then pool", async () => {
    const provider = getProvider();
    const [stakeEntryId] = await findStakeEntryIdFromMint(
      provider.connection,
      provider.wallet.publicKey,
      stakePoolId,
      originalMint.publicKey
    );
    const transaction = new Transaction();
    withCloseStakeEntry(transaction, provider.connection, provider.wallet, {
      stakePoolId: stakePoolId,
      stakeEntryId: stakeEntryId,
    });
    withCloseStakePool(transaction, provider.connection, provider.wallet, {
      stakePoolId: stakePoolId,
    });
    const txEnvelope = new TransactionEnvelope(
      SolanaProvider.init({
        connection: provider.connection,
        wallet: provider.wallet,
        opts: provider.opts,
      }),
      [...transaction.instructions]
    );
    await expectTXTable(txEnvelope, "Close entry and pool", {
      verbosity: "error",
      formatLogs: true,
    }).to.be.fulfilled;

    const stakeEntry = await tryGetAccount(() =>
      getStakeEntry(provider.connection, stakeEntryId)
    );
    expect(stakeEntry).to.eq(null);

    const stakePool = await tryGetAccount(() =>
      getStakePool(provider.connection, stakePoolId)
    );
    expect(stakePool).to.eq(null);
  });
});
