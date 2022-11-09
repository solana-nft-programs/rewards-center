import { tryGetAccount, withWrapSol } from "@cardinal/common";
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
import type * as splToken from "@solana/spl-token";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { expect } from "chai";

import { createStakePool } from "../src";
import { RECEIPT_MANAGER_PAYMENT_MANAGER_NAME } from "../src/programs/receiptManager";
import { getReceiptManager } from "../src/programs/receiptManager/accounts";
import { findReceiptManagerId } from "../src/programs/receiptManager/pda";
import {
  withCloseReceiptManager,
  withInitReceiptManager,
  withUpdateReceiptManager,
} from "../src/programs/receiptManager/transaction";
import { createMasterEditionIxs, createMint } from "./utils";
import { getProvider } from "./workspace";

describe("Create update close receipt manager", () => {
  let originalMint: splToken.Token;
  let stakePoolId: PublicKey;

  const originalMintAuthority = Keypair.generate();
  const invalidAuthority = Keypair.generate();
  const receiptManagerName = `mgr-${Math.random()}`;
  const requiredStakeSeconds = new BN(5);
  const stakeSecondsToUse = new BN(1);
  const updatedStakeSecondsToUse = new BN(10);
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
    [, originalMint] = await createMint(
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

    const airdropTx = await provider.connection.requestAirdrop(
      invalidAuthority.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropTx);
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

  it("Invalid authority", async () => {
    const provider = getProvider();
    const transaction = new Transaction();
    await withInitReceiptManager(
      transaction,
      provider.connection,
      provider.wallet,
      {
        name: receiptManagerName,
        stakePoolId: stakePoolId,
        authority: invalidAuthority.publicKey,
        requiredStakeSeconds: requiredStakeSeconds,
        stakeSecondsToUse: stakeSecondsToUse,
        paymentMint: paymentMint,
        paymentRecipientId: paymentRecipient.publicKey,
        requiresAuthorization: requiresAuthorization,
      }
    );

    expect(async () => {
      await expectTXTable(
        new TransactionEnvelope(
          SolanaProvider.init({
            connection: provider.connection,
            wallet: new SignerWallet(invalidAuthority),
            opts: provider.opts,
          }),
          [...transaction.instructions]
        ),
        "Create receipt manager"
      ).to.be.rejectedWith(Error);
    });
  });

  it("Create Reward Receipt Manager", async () => {
    const provider = getProvider();
    const transaction = new Transaction();
    const [, receiptManagerId] = await withInitReceiptManager(
      transaction,
      provider.connection,
      provider.wallet,
      {
        name: receiptManagerName,
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

  it("Invalid authority updated", async () => {
    const provider = getProvider();
    const transaction = new Transaction();
    await withUpdateReceiptManager(
      transaction,
      provider.connection,
      new SignerWallet(invalidAuthority),
      {
        name: receiptManagerName,
        stakePoolId: stakePoolId,
        authority: invalidAuthority.publicKey,
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
        wallet: new SignerWallet(invalidAuthority),
        opts: provider.opts,
      }),
      [...transaction.instructions]
    );

    await expectTXTable(txEnvelope, "Create receipt manager", {
      verbosity: "error",
      formatLogs: true,
    }).to.be.rejected;
  });

  it("Update reward receipt manager", async () => {
    const provider = getProvider();
    const transaction = new Transaction();
    const [, receiptManagerId] = await withUpdateReceiptManager(
      transaction,
      provider.connection,
      provider.wallet,
      {
        name: receiptManagerName,
        stakePoolId: stakePoolId,
        authority: provider.wallet.publicKey,
        requiredStakeSeconds: requiredStakeSeconds,
        stakeSecondsToUse: updatedStakeSecondsToUse,
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
      updatedStakeSecondsToUse.toString()
    );
    expect(receiptManagerData.parsed.requiresAuthorization.toString()).to.eq(
      requiresAuthorization.toString()
    );
  });

  it("Close reward receipt manager", async () => {
    const provider = getProvider();
    const transaction = new Transaction();
    const [receiptManagerId] = await findReceiptManagerId(
      stakePoolId,
      receiptManagerName
    );
    const txEnvelope = new TransactionEnvelope(SolanaProvider.init(provider), [
      ...withCloseReceiptManager(
        transaction,
        provider.connection,
        provider.wallet,
        {
          receiptManagerId,
        }
      ).instructions,
    ]);

    await expectTXTable(txEnvelope, "Create receipt manager", {
      verbosity: "error",
      formatLogs: true,
    }).to.be.fulfilled;

    const receiptManagerData = await tryGetAccount(() =>
      getReceiptManager(provider.connection, receiptManagerId)
    );
    expect(receiptManagerData).to.eq(null);
  });
});
