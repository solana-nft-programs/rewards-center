import { findAta } from "@cardinal/common";
import { expectTXTable } from "@saberhq/chai-solana";
import {
  SignerWallet,
  SolanaProvider,
  TransactionEnvelope,
} from "@saberhq/solana-contrib";
import type * as splToken from "@solana/spl-token";
import type { Transaction } from "@solana/web3.js";
import { Keypair, PublicKey } from "@solana/web3.js";
import { expect } from "chai";

import { createStakePool, stake, unstake } from "../src";
import { ReceiptType } from "../src/programs/stakePool";
import {
  getActiveStakeEntriesForPool,
  getAllStakePools,
  getStakeEntry,
} from "../src/programs/stakePool/accounts";
import { findStakeEntryIdFromMint } from "../src/programs/stakePool/utils";
import { createMasterEditionIxs, createMint } from "./utils";
import { getProvider } from "./workspace";

describe("Create stake pool", () => {
  let stakePoolId: PublicKey;
  let originalMintTokenAccountId: PublicKey;
  let originalMint: splToken.Token;
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
  });

  it("Create Pool", async () => {
    const provider = getProvider();

    const stakePoolDatasBefore = await getAllStakePools(provider.connection);

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

    const stakePoolDatasAfter = await getAllStakePools(provider.connection);
    expect(stakePoolDatasAfter.length - 1).to.eq(stakePoolDatasBefore.length);
  });

  it("Stake", async () => {
    const provider = getProvider();
    const activeStakeEntriesBefore = await getActiveStakeEntriesForPool(
      provider.connection,
      stakePoolId
    );
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

    const activeStakeEntriesAfter = await getActiveStakeEntriesForPool(
      provider.connection,
      stakePoolId
    );
    expect(activeStakeEntriesAfter.length - 1).to.eq(
      activeStakeEntriesBefore.length
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
    const provider = getProvider();
    const activeStakeEntriesBefore = await getActiveStakeEntriesForPool(
      provider.connection,
      stakePoolId
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

    const activeStakeEntriesAfter = await getActiveStakeEntriesForPool(
      provider.connection,
      stakePoolId
    );
    expect(activeStakeEntriesBefore.length - 1).to.eq(
      activeStakeEntriesAfter.length
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
  });
});
