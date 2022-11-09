import { findAta } from "@cardinal/common";
import { withWrapSol } from "@cardinal/token-manager/dist/cjs/wrappedSol";
import { BN } from "@project-serum/anchor";
import { expectTXTable } from "@saberhq/chai-solana";
import {
  SignerWallet,
  SolanaProvider,
  TransactionEnvelope,
} from "@saberhq/solana-contrib";
import * as splToken from "@solana/spl-token";
import * as web3 from "@solana/web3.js";
import { expect } from "chai";

import {
  claimRewards,
  createStakeEntryAndStakeMint,
  createStakePool,
  stake,
} from "../src";
import { RewardDistributorKind } from "../src/programs/rewardDistributor";
import { getRewardDistributor } from "../src/programs/rewardDistributor/accounts";
import { findRewardDistributorId } from "../src/programs/rewardDistributor/pda";
import { withInitRewardDistributor } from "../src/programs/rewardDistributor/transaction";
import { ReceiptType } from "../src/programs/stakePool";
import { getStakeEntry } from "../src/programs/stakePool/accounts";
import { findStakeEntryIdFromMint } from "../src/programs/stakePool/utils";
import { createMint, delay } from "./utils";
import { getProvider } from "./workspace";

describe("Stake and claim rewards from treasury", () => {
  const maxSupply = 5; // 5 wsol

  let stakePoolId: web3.PublicKey;
  let stakeMintKeypair: web3.Keypair | undefined;
  let originalMint: splToken.Token;
  const rewardMint = new web3.PublicKey(
    "So11111111111111111111111111111111111111112"
  );
  let originalMintTokenAccountId: web3.PublicKey;
  const originalMintAuthority = web3.Keypair.generate();
  const creator = web3.Keypair.generate();
  const creatorWallet = new SignerWallet(creator);

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

    const fromAirdropSignature = await provider.connection.requestAirdrop(
      creatorWallet.publicKey,
      10 * web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(fromAirdropSignature);
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
    const transaction = new web3.Transaction();

    // wrapped sol to creator
    await withWrapSol(
      transaction,
      provider.connection,
      creatorWallet,
      maxSupply * web3.LAMPORTS_PER_SOL
    );

    await withInitRewardDistributor(
      transaction,
      provider.connection,
      creatorWallet,
      {
        stakePoolId: stakePoolId,
        rewardMintId: rewardMint,
        rewardAmount: new BN(1 * web3.LAMPORTS_PER_SOL),
        rewardDurationSeconds: new BN(2),
        kind: RewardDistributorKind.Treasury,
        maxSupply: new BN(maxSupply * web3.LAMPORTS_PER_SOL),
      }
    );

    const txEnvelope = new TransactionEnvelope(
      SolanaProvider.init(provider),
      [...transaction.instructions],
      [creator]
    );

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
      rewardMint.toString()
    );

    expect(rewardDistributorData.parsed.rewardMint.toString()).to.eq(
      rewardMint.toString()
    );

    expect(rewardDistributorData.parsed.rewardMint.toString()).to.eq(
      rewardMint.toString()
    );
  });

  it("Init stake entry and mint", async () => {
    const provider = getProvider();
    let transaction: web3.Transaction;

    [transaction, , stakeMintKeypair] = await createStakeEntryAndStakeMint(
      provider.connection,
      provider.wallet,
      {
        stakePoolId: stakePoolId,
        originalMintId: originalMint.publicKey,
      }
    );

    await expectTXTable(
      new TransactionEnvelope(
        SolanaProvider.init(provider),
        transaction.instructions,
        stakeMintKeypair ? [stakeMintKeypair] : []
      ),
      "Init stake entry"
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

    expect(stakeEntryData.parsed.originalMint.toString()).to.eq(
      originalMint.publicKey.toString()
    );
    expect(stakeEntryData.parsed.pool.toString()).to.eq(stakePoolId.toString());
    expect(stakeEntryData.parsed.stakeMint?.toString()).to.eq(
      stakeMintKeypair?.publicKey.toString()
    );
  });

  it("Stake", async () => {
    const provider = getProvider();

    const transaction = await stake(provider.connection, provider.wallet, {
      stakePoolId: stakePoolId,
      originalMintId: originalMint.publicKey,
      userOriginalMintTokenAccountId: originalMintTokenAccountId,
      receiptType: ReceiptType.Receipt,
    });

    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...transaction.instructions,
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

    if (stakeMintKeypair) {
      const userReceiptMintTokenAccountId = await findAta(
        stakeMintKeypair.publicKey,
        provider.wallet.publicKey,
        true
      );

      expect(stakeEntryData.parsed.lastStakedAt.toNumber()).to.be.greaterThan(
        0
      );
      expect(stakeEntryData.parsed.lastStaker.toString()).to.eq(
        provider.wallet.publicKey.toString()
      );

      const receiptMint = new splToken.Token(
        provider.connection,
        stakeMintKeypair.publicKey,
        splToken.TOKEN_PROGRAM_ID,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        null
      );

      const checkUserReceiptMintTokenAccountId =
        await receiptMint.getAccountInfo(userReceiptMintTokenAccountId);
      expect(checkUserReceiptMintTokenAccountId.amount.toNumber()).to.eq(1);
      expect(checkUserReceiptMintTokenAccountId.isFrozen).to.eq(true);
    }
  });

  it("Claim Rewards", async () => {
    await delay(6000);
    const provider = getProvider();
    const [stakeEntryId] = await findStakeEntryIdFromMint(
      provider.connection,
      provider.wallet.publicKey,
      stakePoolId,
      originalMint.publicKey
    );

    const checkRewardMint = new splToken.Token(
      provider.connection,
      rewardMint,
      splToken.TOKEN_PROGRAM_ID,
      web3.Keypair.generate() // not used
    );

    const userRewardMintTokenAccountId = await findAta(
      rewardMint,
      provider.wallet.publicKey,
      true
    );

    let beforeAmount = 0;
    try {
      beforeAmount = (
        await checkRewardMint.getAccountInfo(userRewardMintTokenAccountId)
      ).amount.toNumber();
    } catch (e) {
      beforeAmount = 0;
    }

    const transaction = await claimRewards(
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
      "Claim Rewards"
    ).to.be.fulfilled;

    const afterCheckUserRewardMintTokenAccountId =
      await checkRewardMint.getAccountInfo(userRewardMintTokenAccountId);
    expect(afterCheckUserRewardMintTokenAccountId.amount.toNumber()).to.eq(
      beforeAmount + 3000000000
    );
  });
});
