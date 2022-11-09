import { findAta, tryGetAccount, withWrapSol } from "@cardinal/common";
import { getPaymentManager } from "@cardinal/payment-manager/dist/cjs/accounts";
import { findPaymentManagerAddress } from "@cardinal/payment-manager/dist/cjs/pda";
import { withInit } from "@cardinal/payment-manager/dist/cjs/transaction";
import { BN } from "@project-serum/anchor";
import { expectTXTable } from "@saberhq/chai-solana";
import {
  SignerWallet,
  SolanaProvider,
  TransactionEnvelope,
} from "@saberhq/solana-contrib";
import * as splToken from "@solana/spl-token";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { expect } from "chai";

import { createStakeEntry, createStakePool, stake } from "../src";
import { RECEIPT_MANAGER_PAYMENT_MANAGER_NAME } from "../src/programs/receiptManager";
import {
  getReceiptEntry,
  getReceiptManager,
  getRewardReceipt,
} from "../src/programs/receiptManager/accounts";
import {
  findReceiptEntryId,
  findReceiptManagerId,
  findRewardReceiptId,
} from "../src/programs/receiptManager/pda";
import {
  withClaimRewardReceipt,
  withInitReceiptEntry,
  withInitReceiptManager,
  withInitRewardReceipt,
  withSetRewardReceiptAllowed,
  withUpdateReceiptManager,
} from "../src/programs/receiptManager/transaction";
import { ReceiptType } from "../src/programs/stakePool";
import { getStakeEntry } from "../src/programs/stakePool/accounts";
import { findStakeEntryId } from "../src/programs/stakePool/pda";
import { findStakeEntryIdFromMint } from "../src/programs/stakePool/utils";
import { createMasterEditionIxs, createMint } from "./utils";
import { getProvider } from "./workspace";

describe("Receipt manages multiple with disallowlist", () => {
  let originalMintTokenAccountId: PublicKey;
  let originalMint: splToken.Token;
  let stakePoolId: PublicKey;

  const originalMintAuthority = Keypair.generate();

  const receiptManagerName1 = `mgr-${Math.random()}`;
  const receiptManagerName2 = `mgr-${Math.random()}`;
  const requiredStakeSeconds = new BN(0);
  const stakeSecondsToUse = new BN(1);
  const requiresAuthorization = false;

  const MAKER_FEE = 0;
  const TAKER_FEE = 0;
  const feeCollector = Keypair.generate();
  const paymentRecipient = Keypair.generate();
  const paymentMint = new PublicKey(
    "So11111111111111111111111111111111111111112"
  );

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

    const transactionAirdrop = new Transaction();
    await withWrapSol(
      transactionAirdrop,
      provider.connection,
      provider.wallet,
      LAMPORTS_PER_SOL
    );

    const txEnvelopeAidrop = new TransactionEnvelope(
      SolanaProvider.init({
        connection: provider.connection,
        wallet: provider.wallet,
        opts: provider.opts,
      }),
      transactionAirdrop.instructions
    );
    await expectTXTable(txEnvelopeAidrop, "before", {
      verbosity: "error",
      formatLogs: true,
    }).to.be.fulfilled;

    const transaction = new Transaction();
    // master edition
    transaction.instructions.push(
      ...(await createMasterEditionIxs(
        originalMint.publicKey,
        originalMintAuthority.publicKey
      ))
    );
    const txEnvelope = new TransactionEnvelope(
      SolanaProvider.init({
        connection: provider.connection,
        wallet: new SignerWallet(originalMintAuthority),
        opts: provider.opts,
      }),
      transaction.instructions
    );
    await expectTXTable(txEnvelope, "before", {
      verbosity: "error",
      formatLogs: true,
    }).to.be.fulfilled;
  });

  it("Create payment manager", async () => {
    const provider = getProvider();
    const transaction = new Transaction();

    const [paymentManagerId] = await findPaymentManagerAddress(
      RECEIPT_MANAGER_PAYMENT_MANAGER_NAME
    );
    const checkIfPaymentManagerExists = await tryGetAccount(() =>
      getPaymentManager(provider.connection, paymentManagerId)
    );
    if (!checkIfPaymentManagerExists) {
      await withInit(
        transaction,
        provider.connection,
        provider.wallet,
        RECEIPT_MANAGER_PAYMENT_MANAGER_NAME,
        feeCollector.publicKey,
        MAKER_FEE,
        TAKER_FEE,
        false
      );
      const txEnvelope = new TransactionEnvelope(
        SolanaProvider.init({
          connection: provider.connection,
          wallet: provider.wallet,
          opts: provider.opts,
        }),
        [...transaction.instructions]
      );
      await expectTXTable(txEnvelope, "Create Payment Manager", {
        verbosity: "error",
        formatLogs: true,
      }).to.be.fulfilled;
    }

    const paymentManagerData = await getPaymentManager(
      provider.connection,
      paymentManagerId
    );
    expect(paymentManagerData.parsed.name).to.eq(
      RECEIPT_MANAGER_PAYMENT_MANAGER_NAME
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

  it("Create Reward Receipt Manager", async () => {
    const provider = getProvider();
    const transaction = new Transaction();
    const [, receiptManagerId] = await withInitReceiptManager(
      transaction,
      provider.connection,
      provider.wallet,
      {
        name: receiptManagerName1,
        stakePoolId: stakePoolId,
        authority: provider.wallet.publicKey,
        requiredStakeSeconds: requiredStakeSeconds,
        stakeSecondsToUse: stakeSecondsToUse,
        paymentMint: paymentMint,
        paymentRecipientId: paymentRecipient.publicKey,
        requiresAuthorization: requiresAuthorization,
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

    await expectTXTable(txEnvelope, "Create receipt manager", {
      verbosity: "error",
      formatLogs: true,
    }).to.be.fulfilled;

    const receiptManagerData = await getReceiptManager(
      provider.connection,
      receiptManagerId
    );
    const [payamentManagerId] = await findPaymentManagerAddress(
      RECEIPT_MANAGER_PAYMENT_MANAGER_NAME
    );
    expect(receiptManagerData.parsed.name.toString()).to.eq(
      receiptManagerName1
    );
    expect(receiptManagerData.parsed.paymentManager.toString()).to.eq(
      payamentManagerId.toString()
    );
    expect(receiptManagerData.parsed.authority.toString()).to.eq(
      provider.wallet.publicKey.toString()
    );
    expect(receiptManagerData.parsed.paymentMint.toString()).to.eq(
      paymentMint.toString()
    );
    expect(receiptManagerData.parsed.stakePool.toString()).to.eq(
      stakePoolId.toString()
    );
    expect(receiptManagerData.parsed.requiredStakeSeconds.toString()).to.eq(
      requiredStakeSeconds.toString()
    );
    expect(receiptManagerData.parsed.stakeSecondsToUse.toString()).to.eq(
      stakeSecondsToUse.toString()
    );
    expect(receiptManagerData.parsed.requiresAuthorization.toString()).to.eq(
      requiresAuthorization.toString()
    );
  });

  it("Create Reward Receipt Manager", async () => {
    const provider = getProvider();
    const transaction = new Transaction();
    const [, receiptManagerId] = await withInitReceiptManager(
      transaction,
      provider.connection,
      provider.wallet,
      {
        name: receiptManagerName2,
        stakePoolId: stakePoolId,
        authority: provider.wallet.publicKey,
        requiredStakeSeconds: requiredStakeSeconds,
        stakeSecondsToUse: stakeSecondsToUse,
        paymentMint: paymentMint,
        paymentRecipientId: paymentRecipient.publicKey,
        requiresAuthorization: requiresAuthorization,
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

    await expectTXTable(txEnvelope, "Create receipt manager", {
      verbosity: "error",
      formatLogs: true,
    }).to.be.fulfilled;

    const receiptManagerData = await getReceiptManager(
      provider.connection,
      receiptManagerId
    );
    const [payamentManagerId] = await findPaymentManagerAddress(
      RECEIPT_MANAGER_PAYMENT_MANAGER_NAME
    );
    expect(receiptManagerData.parsed.name.toString()).to.eq(
      receiptManagerName2
    );
    expect(receiptManagerData.parsed.paymentManager.toString()).to.eq(
      payamentManagerId.toString()
    );
    expect(receiptManagerData.parsed.authority.toString()).to.eq(
      provider.wallet.publicKey.toString()
    );
    expect(receiptManagerData.parsed.paymentMint.toString()).to.eq(
      paymentMint.toString()
    );
    expect(receiptManagerData.parsed.stakePool.toString()).to.eq(
      stakePoolId.toString()
    );
    expect(receiptManagerData.parsed.requiredStakeSeconds.toString()).to.eq(
      requiredStakeSeconds.toString()
    );
    expect(receiptManagerData.parsed.stakeSecondsToUse.toString()).to.eq(
      stakeSecondsToUse.toString()
    );
    expect(receiptManagerData.parsed.requiresAuthorization.toString()).to.eq(
      requiresAuthorization.toString()
    );
  });

  it("Init stake entry for pool", async () => {
    const provider = getProvider();

    const [transaction, _] = await createStakeEntry(
      provider.connection,
      provider.wallet,
      {
        stakePoolId: stakePoolId,
        originalMintId: originalMint.publicKey,
      }
    );

    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...transaction.instructions,
      ]),
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
    expect(Number(checkUserOriginalTokenAccount.amount)).to.eq(1);
    expect(checkUserOriginalTokenAccount.isFrozen).to.eq(true);
  });

  it("Init Receipt Entry", async () => {
    const provider = getProvider();
    const transaction = new Transaction();

    const [stakeEntryId] = await findStakeEntryId(
      provider.wallet.publicKey,
      stakePoolId,
      originalMint.publicKey,
      false
    );
    const [, receiptEntryId] = await withInitReceiptEntry(
      transaction,
      provider.connection,
      provider.wallet,
      {
        stakeEntryId: stakeEntryId,
      }
    );
    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...transaction.instructions,
      ]),
      "Init Receipt Entry"
    ).to.be.fulfilled;

    const receiptEntryData = await getReceiptEntry(
      provider.connection,
      receiptEntryId
    );
    expect(receiptEntryData.parsed.stakeEntry.toString()).to.eq(
      receiptEntryData.parsed.stakeEntry.toString()
    );
    expect(receiptEntryData.parsed.usedStakeSeconds.toNumber()).to.eq(0);
  });

  it("Init Reward Receipt, first receipt manager", async () => {
    const provider = getProvider();
    const transaction = new Transaction();

    const [receiptManagerId] = await findReceiptManagerId(
      stakePoolId,
      receiptManagerName1
    );
    const [stakeEntryId] = await findStakeEntryId(
      provider.wallet.publicKey,
      stakePoolId,
      originalMint.publicKey,
      false
    );

    const [receiptEntryId] = await findReceiptEntryId(stakeEntryId);
    const [, rewardReceiptId] = await withInitRewardReceipt(
      transaction,
      provider.connection,
      provider.wallet,
      {
        receiptManagerId: receiptManagerId,
        receiptEntryId: receiptEntryId,
        stakeEntryId: stakeEntryId,
        payer: provider.wallet.publicKey,
      }
    );

    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...transaction.instructions,
      ]),
      "Init Receipt Receipt"
    ).to.be.fulfilled;

    const rewardReceiptData = await getRewardReceipt(
      provider.connection,
      rewardReceiptId
    );
    expect(rewardReceiptData.parsed.allowed).to.be.true;
    expect(rewardReceiptData.parsed.target.toString()).to.eq(
      PublicKey.default.toString()
    );
    expect(rewardReceiptData.parsed.receiptEntry.toString()).to.eq(
      receiptEntryId.toString()
    );
    expect(rewardReceiptData.parsed.receiptManager.toString()).to.eq(
      receiptManagerId.toString()
    );
  });

  it("Init Reward Receipt, second receipt manager", async () => {
    const provider = getProvider();
    const transaction = new Transaction();

    const [receiptManagerId] = await findReceiptManagerId(
      stakePoolId,
      receiptManagerName2
    );
    const [stakeEntryId] = await findStakeEntryId(
      provider.wallet.publicKey,
      stakePoolId,
      originalMint.publicKey,
      false
    );

    const [receiptEntryId] = await findReceiptEntryId(stakeEntryId);
    const [, rewardReceiptId] = await withInitRewardReceipt(
      transaction,
      provider.connection,
      provider.wallet,
      {
        receiptManagerId: receiptManagerId,
        receiptEntryId: receiptEntryId,
        stakeEntryId: stakeEntryId,
        payer: provider.wallet.publicKey,
      }
    );

    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...transaction.instructions,
      ]),
      "Init Receipt"
    ).to.be.fulfilled;

    const rewardReceiptData = await getRewardReceipt(
      provider.connection,
      rewardReceiptId
    );
    expect(rewardReceiptData.parsed.allowed).to.be.true;
    expect(rewardReceiptData.parsed.target.toString()).to.eq(
      PublicKey.default.toString()
    );
    expect(rewardReceiptData.parsed.receiptEntry.toString()).to.eq(
      receiptEntryId.toString()
    );
    expect(rewardReceiptData.parsed.receiptManager.toString()).to.eq(
      receiptManagerId.toString()
    );
  });

  it("Set requires authorization to true for second receipt manager", async () => {
    const provider = getProvider();
    const transaction = new Transaction();

    const [receiptManagerId] = await findReceiptManagerId(
      stakePoolId,
      receiptManagerName2
    );
    const beforeReceiptManagerData = await getReceiptManager(
      provider.connection,
      receiptManagerId
    );
    expect(beforeReceiptManagerData.parsed.requiresAuthorization).to.be.false;

    await withUpdateReceiptManager(
      transaction,
      provider.connection,
      provider.wallet,
      {
        name: receiptManagerName2,
        stakePoolId: stakePoolId,
        authority: beforeReceiptManagerData.parsed.authority,
        requiredStakeSeconds:
          beforeReceiptManagerData.parsed.requiredStakeSeconds,
        stakeSecondsToUse: beforeReceiptManagerData.parsed.stakeSecondsToUse,
        paymentMint: beforeReceiptManagerData.parsed.paymentMint,
        paymentRecipientId: beforeReceiptManagerData.parsed.paymentRecipient,
        requiresAuthorization: true,
      }
    );

    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...transaction.instructions,
      ]),
      "Set requires authoritzation to true"
    ).to.be.fulfilled;

    const afterReceiptManagerData = await getReceiptManager(
      provider.connection,
      receiptManagerId
    );
    expect(afterReceiptManagerData.parsed.requiresAuthorization).to.be.true;
  });

  it("Set reward receipt auth to false, second receipt manager", async () => {
    const provider = getProvider();
    const transaction = new Transaction();

    const [stakeEntryId] = await findStakeEntryId(
      provider.wallet.publicKey,
      stakePoolId,
      originalMint.publicKey,
      false
    );
    const [receiptManagerId] = await findReceiptManagerId(
      stakePoolId,
      receiptManagerName2
    );

    const [receiptEntryId] = await findReceiptEntryId(stakeEntryId);
    const [receiptId] = await findRewardReceiptId(
      receiptManagerId,
      receiptEntryId
    );
    const beforeReceiptData = await getRewardReceipt(
      provider.connection,
      receiptId
    );
    expect(beforeReceiptData.parsed.allowed).to.be.true;

    withSetRewardReceiptAllowed(
      transaction,
      provider.connection,
      provider.wallet,
      {
        auth: false,
        receiptManagerId: receiptManagerId,
        rewardReceiptId: receiptId,
      }
    );

    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...transaction.instructions,
      ]),
      "Set reward receipt auth"
    ).to.be.fulfilled;

    const afterReceiptData = await getRewardReceipt(
      provider.connection,
      receiptId
    );
    expect(afterReceiptData.parsed.allowed).to.be.false;
  });

  it("Claim Reward Receipt, first receipt manager", async () => {
    const provider = getProvider();
    const [stakeEntryId] = await findStakeEntryId(
      provider.wallet.publicKey,
      stakePoolId,
      originalMint.publicKey,
      false
    );
    const [receiptEntryId] = await findReceiptEntryId(stakeEntryId);
    const checkMint = new splToken.Token(
      provider.connection,
      paymentMint,
      splToken.TOKEN_PROGRAM_ID,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      null
    );
    const paymentTokenAccountId = await findAta(
      paymentMint,
      paymentRecipient.publicKey,
      true
    );
    let beforeBalance = 0;
    try {
      beforeBalance = Number(
        (await checkMint.getAccountInfo(paymentTokenAccountId)).amount
      );
    } catch (e) {
      beforeBalance = 0;
    }

    const transaction = new Transaction();
    const [, rewardReceiptId] = await withClaimRewardReceipt(
      transaction,
      provider.connection,
      provider.wallet,
      {
        receiptManagerName: receiptManagerName1,
        stakePoolId: stakePoolId,
        stakeEntryId: stakeEntryId,
        claimer: provider.wallet.publicKey,
        payer: provider.wallet.publicKey,
      }
    );
    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...transaction.instructions,
      ]),
      "Claim Reward Receipt"
    ).to.be.fulfilled;

    const [receiptManagerId] = await findReceiptManagerId(
      stakePoolId,
      receiptManagerName1
    );

    const checkRewardReceiptData = await tryGetAccount(() =>
      getRewardReceipt(provider.connection, rewardReceiptId)
    );
    expect(checkRewardReceiptData).to.not.be.null;
    expect(checkRewardReceiptData?.parsed.target.toString()).to.eq(
      provider.wallet.publicKey.toString()
    );
    expect(checkRewardReceiptData?.parsed.receiptEntry.toString()).to.eq(
      receiptEntryId.toString()
    );
    expect(checkRewardReceiptData?.parsed.receiptManager.toString()).to.eq(
      receiptManagerId.toString()
    );

    const paymentTokenAccountData = await checkMint.getAccountInfo(
      paymentTokenAccountId
    );
    expect(paymentTokenAccountData.amount.toString()).to.eq(
      (beforeBalance + 2 * 10 ** 6).toString()
    );

    const receiptEntryData = await getReceiptEntry(
      provider.connection,
      receiptEntryId
    );
    expect(receiptEntryData.parsed.usedStakeSeconds.toNumber()).to.eq(
      stakeSecondsToUse.toNumber()
    );
  });

  it("Fail to Claim Reward Receipt, second receipt manager", async () => {
    const provider = getProvider();
    const [stakeEntryId] = await findStakeEntryId(
      provider.wallet.publicKey,
      stakePoolId,
      originalMint.publicKey,
      false
    );

    const transaction = new Transaction();
    await withClaimRewardReceipt(
      transaction,
      provider.connection,
      provider.wallet,
      {
        receiptManagerName: receiptManagerName2,
        stakePoolId: stakePoolId,
        stakeEntryId: stakeEntryId,
        claimer: provider.wallet.publicKey,
        payer: provider.wallet.publicKey,
      }
    );

    expect(async () => {
      await expectTXTable(
        new TransactionEnvelope(SolanaProvider.init(provider), [
          ...transaction.instructions,
        ]),
        "Claim Reward Receipt"
      ).to.be.rejectedWith(Error);
    });
  });
});
