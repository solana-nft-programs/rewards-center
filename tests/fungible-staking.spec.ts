import { findAta } from "@cardinal/common";
import { BN } from "@project-serum/anchor";
import { expectTXTable } from "@saberhq/chai-solana";
import { SolanaProvider, TransactionEnvelope } from "@saberhq/solana-contrib";
import * as splToken from "@solana/spl-token";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { expect } from "chai";
import { assert } from "console";

import {
  createStakeEntryAndStakeMint,
  createStakePool,
  initializeRewardEntry,
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
import { createMint } from "./utils";
import { getProvider } from "./workspace";

describe("Create stake pool", () => {
  let stakePoolId: PublicKey;
  let originalMintTokenAccountId: PublicKey;
  let originalMint: splToken.Token;
  let rewardMint: splToken.Token;

  const maxSupply = 100;
  const stakingAmount = 10;
  const originalMintAuthority = Keypair.generate();
  const rewardMintAuthority = Keypair.generate();
  let stakeMintKeypair: Keypair | undefined;

  before(async () => {
    const provider = getProvider();
    // original mint
    [originalMintTokenAccountId, originalMint] = await createMint(
      provider.connection,
      originalMintAuthority,
      provider.wallet.publicKey,
      stakingAmount,
      originalMintAuthority.publicKey
    );

    // reward mint
    [, rewardMint] = await createMint(
      provider.connection,
      rewardMintAuthority,
      provider.wallet.publicKey,
      maxSupply,
      rewardMintAuthority.publicKey
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
  });

  it("Init Reward Entry", async () => {
    const provider = getProvider();
    const [rewardDistributorId] = await findRewardDistributorId(stakePoolId);
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

    await expectTXTable(txEnvelope, "Init reward entry", {
      verbosity: "error",
      formatLogs: true,
    }).to.be.fulfilled;

    const rewardDistributorData = await getRewardDistributor(
      provider.connection,
      rewardDistributorId
    );

    expect(rewardDistributorData.parsed.rewardMint.toString()).to.eq(
      rewardMint.publicKey.toString()
    );
  });

  it("Init fungible stake entry and stake mint", async () => {
    const provider = getProvider();
    let transaction: Transaction;

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
        [...transaction.instructions],
        stakeMintKeypair ? [stakeMintKeypair] : []
      ),
      "Init fungible stake entry"
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
    if (stakeMintKeypair) {
      expect(stakeEntryData.parsed.stakeMint?.toString()).to.eq(
        stakeMintKeypair.publicKey.toString()
      );

      const checkMint = new splToken.Token(
        provider.connection,
        stakeMintKeypair.publicKey,
        splToken.TOKEN_PROGRAM_ID,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        null
      );

      expect((await checkMint.getMintInfo()).isInitialized).to.be.true;
    }
  });

  it("Stake half", async () => {
    const provider = getProvider();

    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...(
          await stake(provider.connection, provider.wallet, {
            stakePoolId: stakePoolId,
            originalMintId: originalMint.publicKey,
            userOriginalMintTokenAccountId: originalMintTokenAccountId,
            receiptType: ReceiptType.Receipt,
            amount: new BN(stakingAmount / 2),
          })
        ).instructions,
      ]),
      "Stake half"
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

    const stakeEntryOriginalMintTokenAccountId = await findAta(
      originalMint.publicKey,
      stakeEntryData.pubkey,
      true
    );

    if (stakeMintKeypair) {
      const userReceiptTokenAccountId = await findAta(
        stakeMintKeypair.publicKey,
        provider.wallet.publicKey,
        true
      );

      expect(stakeEntryData.parsed.amount.toNumber()).to.eq(stakingAmount / 2);
      expect(stakeEntryData.parsed.lastStakedAt.toNumber()).to.be.greaterThan(
        0
      );
      expect(stakeEntryData.parsed.lastStaker.toString()).to.eq(
        provider.wallet.publicKey.toString()
      );

      const checkUserOriginalTokenAccount = await originalMint.getAccountInfo(
        userOriginalMintTokenAccountId
      );
      expect(checkUserOriginalTokenAccount.amount.toNumber()).to.eq(
        stakingAmount / 2
      );

      const checkStakeEntryOriginalMintTokenAccount =
        await originalMint.getAccountInfo(stakeEntryOriginalMintTokenAccountId);
      expect(checkStakeEntryOriginalMintTokenAccount.amount.toNumber()).to.eq(
        stakingAmount / 2
      );

      const checkReceiptMint = new splToken.Token(
        provider.connection,
        stakeMintKeypair.publicKey,
        splToken.TOKEN_PROGRAM_ID,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        null
      );
      const userReceiptTokenAccount = await checkReceiptMint.getAccountInfo(
        userReceiptTokenAccountId
      );
      expect(userReceiptTokenAccount.amount.toNumber()).to.eq(1);
    }
  });

  it("Stake another half", async () => {
    const provider = getProvider();

    try {
      await stake(provider.connection, provider.wallet, {
        stakePoolId: stakePoolId,
        originalMintId: originalMint.publicKey,
        userOriginalMintTokenAccountId: originalMintTokenAccountId,
        receiptType: ReceiptType.Receipt,
        amount: new BN(stakingAmount / 2),
      });
      assert(
        false,
        "Staked ix should have failed because there are tokens already staked"
      );
    } catch (e) {
      assert(true);
    }
  });

  it("Unstake", async () => {
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
    expect(checkUserOriginalTokenAccount.amount.toNumber()).to.eq(10);
    expect(checkUserOriginalTokenAccount.isFrozen).to.eq(false);
  });
});
