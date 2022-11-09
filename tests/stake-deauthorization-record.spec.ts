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
import { expect } from "chai";

import { authorizeStakeEntry, createStakeEntry, createStakePool } from "../src";
import {
  getStakeAuthorization,
  getStakeAuthorizationsForPool,
  getStakePool,
} from "../src/programs/stakePool/accounts";
import { findStakeAuthorizationId } from "../src/programs/stakePool/pda";
import { withDeauthorizeStakeEntry } from "../src/programs/stakePool/transaction";
import { createMasterEditionIxs, createMint } from "./utils";
import { getProvider } from "./workspace";

describe("Requires authorization success", () => {
  const overlayText = "staking";
  let originalMint: splToken.Token;
  let stakePoolId: PublicKey;
  const originalMintAuthority = Keypair.generate();

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

  it("Deathorize mint for stake", async () => {
    const provider = getProvider();

    const transaction = await withDeauthorizeStakeEntry(
      new Transaction(),
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
      "Deathorize mint"
    ).to.be.fulfilled;

    const stakeAuthorizationData = await tryGetAccount(async () =>
      getStakeAuthorization(
        provider.connection,
        (
          await findStakeAuthorizationId(stakePoolId, originalMint.publicKey)
        )[0]
      )
    );
    expect(stakeAuthorizationData).to.eq(null);

    const stakeAuthorizationsForPool = await getStakeAuthorizationsForPool(
      provider.connection,
      stakePoolId
    );
    expect(stakeAuthorizationsForPool.length).to.eq(0);
  });

  it("Init stake entry for pool", async () => {
    const provider = getProvider();
    let transaction: Transaction;

    [transaction, stakePoolId] = await createStakeEntry(
      provider.connection,
      provider.wallet,
      {
        stakePoolId: stakePoolId,
        originalMintId: originalMint.publicKey,
      }
    );
    expect(async () => {
      await expectTXTable(
        new TransactionEnvelope(SolanaProvider.init(provider), [
          ...transaction.instructions,
        ]),
        "Fail init"
      ).to.be.rejectedWith(Error);
    });
  });
});
