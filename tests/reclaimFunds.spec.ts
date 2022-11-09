import { findAta } from "@cardinal/common";
import { expectTXTable } from "@saberhq/chai-solana";
import { SolanaProvider, TransactionEnvelope } from "@saberhq/solana-contrib";
import * as splToken from "@solana/spl-token";
import * as web3 from "@solana/web3.js";
import { BN } from "bn.js";
import { expect } from "chai";

import { createRewardDistributor, createStakePool } from "../src";
import { RewardDistributorKind } from "../src/programs/rewardDistributor";
import { getRewardDistributor } from "../src/programs/rewardDistributor/accounts";
import { findRewardDistributorId } from "../src/programs/rewardDistributor/pda";
import { withReclaimFunds } from "../src/programs/rewardDistributor/transaction";
import { createMint } from "./utils";
import { getProvider } from "./workspace";

describe("Reclaim funds", () => {
  const maxSupply = 100;
  let stakePoolId: web3.PublicKey;
  let rewardMint: splToken.Token;
  const originalMintAuthority = web3.Keypair.generate();

  before(async () => {
    const provider = getProvider();
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

    let transaction: web3.Transaction;
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

    const [transaction] = await createRewardDistributor(
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

    await expectTXTable(txEnvelope, "Create reward distributor", {
      verbosity: "error",
      formatLogs: true,
    }).to.be.fulfilled;

    const [rewardDistributorId] = await findRewardDistributorId(stakePoolId);
    const rewardDistributorData = await getRewardDistributor(
      provider.connection,
      rewardDistributorId
    );

    expect(rewardDistributorData.parsed.defaultMultiplier.toString()).to.eq(
      "1"
    );

    expect(rewardDistributorData.parsed.multiplierDecimals.toString()).to.eq(
      "0"
    );
  });

  it("Reclaim funds", async () => {
    const provider = getProvider();
    const transaction = new web3.Transaction();

    await withReclaimFunds(transaction, provider.connection, provider.wallet, {
      stakePoolId: stakePoolId,
      amount: new BN(50),
    });

    const txEnvelope = new TransactionEnvelope(SolanaProvider.init(provider), [
      ...transaction.instructions,
    ]);

    await expectTXTable(txEnvelope, "Reclaim funds", {
      verbosity: "error",
      formatLogs: true,
    }).to.be.fulfilled;

    const [rewardDistributorId] = await findRewardDistributorId(stakePoolId);
    const rewardDistributorData = await getRewardDistributor(
      provider.connection,
      rewardDistributorId
    );
    const rewardDistributorTokenAccountId = await findAta(
      rewardDistributorData.parsed.rewardMint,
      rewardDistributorId,
      true
    );
    const rewardMint = new splToken.Token(
      provider.connection,
      rewardDistributorData.parsed.rewardMint,
      splToken.TOKEN_PROGRAM_ID,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      null
    );
    const rewardDistributorTokenAccount = await rewardMint.getAccountInfo(
      rewardDistributorTokenAccountId
    );

    expect(rewardDistributorTokenAccount.amount.toNumber()).to.eq(50);
  });
});
