import { findAta } from "@cardinal/common";
import { expectTXTable } from "@saberhq/chai-solana";
import {
  SignerWallet,
  SolanaProvider,
  TransactionEnvelope,
} from "@saberhq/solana-contrib";
import type * as splToken from "@solana/spl-token";
import type { PublicKey, Transaction } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";
import { expect } from "chai";

import {
  authorizeStakeEntry,
  createStakeEntry,
  createStakePool,
  stake,
} from "../src";
import { ReceiptType } from "../src/programs/stakePool";
import {
  getStakeAuthorization,
  getStakeAuthorizationsForPool,
  getStakeEntry,
  getStakePool,
} from "../src/programs/stakePool/accounts";
import { findStakeAuthorizationId } from "../src/programs/stakePool/pda";
import { findStakeEntryIdFromMint } from "../src/programs/stakePool/utils";
import { createMasterEditionIxs, createMint } from "./utils";
import { getProvider } from "./workspace";

describe("Requires authorization success", () => {
  const overlayText = "staking";
  let originalMintTokenAccountId: PublicKey;
  let originalMint: splToken.Token;
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
  });

  it("Create Pool", async () => {
    const provider = getProvider();

    let transaction: Transaction;
    [transaction, stakePoolId] = await createStakePool(
      provider.connection,
      provider.wallet,
      {
        overlayText: overlayText,
        requiresCreators: [],
        requiresAuthorization: true,
      }
    );
    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...transaction.instructions,
      ]),
      "Create pool"
    ).to.be.fulfilled;

    const stakePoolData = await getStakePool(provider.connection, stakePoolId);
    expect(stakePoolData.parsed.overlayText).to.be.eq(overlayText);
    expect(stakePoolData.parsed.requiresAuthorization).to.be.true;
  });

  it("Authorize mint for stake", async () => {
    const provider = getProvider();

    const transaction = await authorizeStakeEntry(
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

    const stakeAuthorizationData = await getStakeAuthorization(
      provider.connection,
      (
        await findStakeAuthorizationId(stakePoolId, originalMint.publicKey)
      )[0]
    );

    expect(stakeAuthorizationData).to.not.eq(null);

    const stakeAuthorizationsForPool = await getStakeAuthorizationsForPool(
      provider.connection,
      stakePoolId
    );
    expect(stakeAuthorizationsForPool.length).to.eq(1);
    expect(stakeAuthorizationData.pubkey.toString()).to.eq(
      stakeAuthorizationsForPool[0]?.pubkey.toString()
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

  it("Stake successs", async () => {
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
});
