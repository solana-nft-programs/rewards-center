import {
  findAta,
  tryGetAccount,
  withFindOrInitAssociatedTokenAccount,
} from "@cardinal/common";
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
import { BN } from "bn.js";
import { expect } from "chai";

import { createStakeEntry, createStakePool, unstake } from "../src";
import { ReceiptType } from "../src/programs/stakePool";
import { getStakeEntry } from "../src/programs/stakePool/accounts";
import { findStakeEntryId } from "../src/programs/stakePool/pda";
import {
  withClaimReceiptMint,
  withReassignStakeEntry,
  withStake,
} from "../src/programs/stakePool/transaction";
import { findStakeEntryIdFromMint } from "../src/programs/stakePool/utils";
import { createMasterEditionIxs, createMint } from "./utils";
import { getProvider } from "./workspace";

describe("Reassign staker", () => {
  let stakePoolId: PublicKey;
  let originalMintTokenAccountId: PublicKey;
  let originalMint: splToken.Token;
  const originalMintAuthority = Keypair.generate();
  const newStaker = Keypair.generate();

  before(async () => {
    const provider = getProvider();
    const fromAirdropSignature = await provider.connection.requestAirdrop(
      newStaker.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(fromAirdropSignature);

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

  it("Stake", async () => {
    const provider = getProvider();
    let transaction = new Transaction();
    const [stakeEntryId] = await findStakeEntryIdFromMint(
      provider.connection,
      provider.wallet.publicKey,
      stakePoolId,
      originalMint.publicKey
    );
    const checkStakeEntryData = await tryGetAccount(() =>
      getStakeEntry(provider.connection, stakeEntryId)
    );
    if (!checkStakeEntryData) {
      [transaction] = await createStakeEntry(
        provider.connection,
        provider.wallet,
        {
          stakePoolId: stakePoolId,
          originalMintId: originalMint.publicKey,
        }
      );
    }

    await withStake(transaction, provider.connection, provider.wallet, {
      stakePoolId: stakePoolId,
      originalMintId: originalMint.publicKey,
      userOriginalMintTokenAccountId: originalMintTokenAccountId,
      amount: new BN(1),
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
    expect(checkUserOriginalTokenAccount.isFrozen).to.eq(false);
  });

  it("Reassign stake entry", async () => {
    const provider = getProvider();
    const transaction = new Transaction();

    const [stakeEntryId] = await findStakeEntryId(
      provider.wallet.publicKey,
      stakePoolId,
      originalMint.publicKey,
      false
    );
    withReassignStakeEntry(transaction, provider.connection, provider.wallet, {
      stakePoolId: stakePoolId,
      stakeEntryId: stakeEntryId,
      target: newStaker.publicKey,
    });

    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...transaction.instructions,
      ]),
      "Reassign stake antry"
    ).to.be.fulfilled;

    const stakeEntryData = await getStakeEntry(
      provider.connection,
      stakeEntryId
    );
    expect(stakeEntryData.parsed.lastStaker.toString()).to.eq(
      newStaker.publicKey.toString()
    );
  });

  it("Claim receipt mint", async () => {
    const provider = getProvider();
    const transaction = new Transaction();

    const [stakeEntryId] = await findStakeEntryId(
      provider.wallet.publicKey,
      stakePoolId,
      originalMint.publicKey,
      false
    );

    await withClaimReceiptMint(
      transaction,
      provider.connection,
      new SignerWallet(newStaker),
      {
        stakePoolId: stakePoolId,
        stakeEntryId: stakeEntryId,
        originalMintId: originalMint.publicKey,
        receiptMintId: originalMint.publicKey,
        receiptType: ReceiptType.Original,
      }
    );

    await expectTXTable(
      new TransactionEnvelope(
        SolanaProvider.init(provider),
        [...transaction.instructions],
        [newStaker]
      ),
      "Claim receipt mint"
    ).to.be.fulfilled;

    const userOriginalMintTokenAccountId = await findAta(
      originalMint.publicKey,
      newStaker.publicKey,
      true
    );
    const checkUserOriginalTokenAccount = await originalMint.getAccountInfo(
      userOriginalMintTokenAccountId
    );
    expect(checkUserOriginalTokenAccount.amount.toNumber()).to.eq(1);
    expect(checkUserOriginalTokenAccount.isFrozen).to.eq(true);
  });

  it("Unstake", async () => {
    const provider = getProvider();
    let transaction = new Transaction();
    await withFindOrInitAssociatedTokenAccount(
      transaction,
      provider.connection,
      originalMint.publicKey,
      newStaker.publicKey,
      provider.wallet.publicKey,
      true
    );
    transaction = await unstake(
      provider.connection,
      new SignerWallet(newStaker),
      {
        stakePoolId: stakePoolId,
        originalMintId: originalMint.publicKey,
      }
    );

    await expectTXTable(
      new TransactionEnvelope(
        SolanaProvider.init(provider),
        transaction.instructions,
        [newStaker]
      ),
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
      newStaker.publicKey,
      true
    );
    const checkUserOriginalTokenAccount = await originalMint.getAccountInfo(
      userOriginalMintTokenAccountId
    );
    expect(checkUserOriginalTokenAccount.amount.toNumber()).to.eq(1);
    expect(checkUserOriginalTokenAccount.isFrozen).to.eq(false);
  });
});
