import { tryGetAccount } from "@cardinal/common";
import { Program } from "@project-serum/anchor";
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

import { createStakePool } from "../src";
import type { STAKE_POOL_PROGRAM } from "../src/programs/stakePool";
import { STAKE_POOL_ADDRESS, STAKE_POOL_IDL } from "../src/programs/stakePool";
import { getStakeBooster } from "../src/programs/stakePool/accounts";
import { findStakeBoosterId } from "../src/programs/stakePool/pda";
import {
  withCloseStakeBooster,
  withInitStakeBooster,
  withUpdateStakeBooster,
} from "../src/programs/stakePool/transaction";
import { createMasterEditionIxs, createMint } from "./utils";
import { getProvider } from "./workspace";

describe("Create stake pool", () => {
  let stakePoolId: PublicKey;
  let originalMint: splToken.Token;
  let paymentMint: splToken.Token;
  const originalMintAuthority = Keypair.generate();
  const STAKE_BOOSTER_PAYMENT_AMOUNT = new BN(2);
  const BOOST_SECONDS = new BN(10);
  const UPDATE_BOOST_SECONDS = new BN(20);

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

    // payment mint
    [, paymentMint] = await createMint(
      provider.connection,
      originalMintAuthority,
      provider.wallet.publicKey,
      100,
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

  it("Create booster", async () => {
    const provider = getProvider();
    await expectTXTable(
      new TransactionEnvelope(
        SolanaProvider.init(provider),
        (
          await withInitStakeBooster(
            new Transaction(),
            provider.connection,
            provider.wallet,
            {
              stakePoolId: stakePoolId,
              paymentAmount: STAKE_BOOSTER_PAYMENT_AMOUNT,
              paymentMint: paymentMint.publicKey,
              boostSeconds: BOOST_SECONDS,
              startTimeSeconds: Date.now() / 1000,
            }
          )
        ).instructions
      ),
      "Create booster"
    ).to.be.fulfilled;

    const [stakeBoosterId] = await findStakeBoosterId(stakePoolId);
    const stakeBooster = await getStakeBooster(
      provider.connection,
      stakeBoosterId
    );
    expect(stakeBooster.parsed.stakePool.toString()).to.eq(
      stakePoolId.toString()
    );
    expect(stakeBooster.parsed.identifier.toString()).to.eq(
      new BN(0).toString()
    );
    expect(stakeBooster.parsed.boostSeconds.toString()).to.eq(
      BOOST_SECONDS.toString()
    );
    expect(stakeBooster.parsed.paymentAmount.toString()).to.eq(
      STAKE_BOOSTER_PAYMENT_AMOUNT.toString()
    );
    expect(stakeBooster.parsed.paymentMint.toString()).to.eq(
      paymentMint.publicKey.toString()
    );
  });

  it("Update booster", async () => {
    const provider = getProvider();
    await expectTXTable(
      new TransactionEnvelope(
        SolanaProvider.init(provider),
        (
          await withUpdateStakeBooster(
            new Transaction(),
            provider.connection,
            provider.wallet,
            {
              stakePoolId: stakePoolId,
              paymentAmount: STAKE_BOOSTER_PAYMENT_AMOUNT,
              paymentMint: paymentMint.publicKey,
              boostSeconds: UPDATE_BOOST_SECONDS,
              startTimeSeconds: Date.now() / 1000,
            }
          )
        ).instructions
      ),
      "Create booster"
    ).to.be.fulfilled;

    const [stakeBoosterId] = await findStakeBoosterId(stakePoolId);
    const stakeBooster = await getStakeBooster(
      provider.connection,
      stakeBoosterId
    );
    expect(stakeBooster.parsed.stakePool.toString()).to.eq(
      stakePoolId.toString()
    );
    expect(stakeBooster.parsed.identifier.toString()).to.eq(
      new BN(0).toString()
    );
    expect(stakeBooster.parsed.boostSeconds.toString()).to.eq(
      UPDATE_BOOST_SECONDS.toString()
    );
    expect(stakeBooster.parsed.paymentAmount.toString()).to.eq(
      STAKE_BOOSTER_PAYMENT_AMOUNT.toString()
    );
    expect(stakeBooster.parsed.paymentMint.toString()).to.eq(
      paymentMint.publicKey.toString()
    );
  });

  it("Update booster invalid payment manager", async () => {
    const provider = getProvider();
    const stakePoolProgram = new Program<STAKE_POOL_PROGRAM>(
      STAKE_POOL_IDL,
      STAKE_POOL_ADDRESS,
      provider
    );
    const [stakeBoosterId] = await findStakeBoosterId(stakePoolId);
    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        stakePoolProgram.instruction.updateStakeBooster(
          {
            paymentAmount: STAKE_BOOSTER_PAYMENT_AMOUNT,
            paymentMint: paymentMint.publicKey,
            boostSeconds: UPDATE_BOOST_SECONDS,
            paymentManager: Keypair.generate().publicKey,
            startTimeSeconds: new BN(Date.now() / 1000),
          },
          {
            accounts: {
              stakePool: stakePoolId,
              stakeBooster: stakeBoosterId,
              authority: provider.wallet.publicKey,
            },
          }
        ),
      ]),
      "Update booster invalid payment manager"
    ).to.be.rejected;
  });

  it("Close booster", async () => {
    const provider = getProvider();
    const [stakeBoosterId] = await findStakeBoosterId(stakePoolId);
    await expectTXTable(
      new TransactionEnvelope(
        SolanaProvider.init(provider),
        (
          await withCloseStakeBooster(
            new Transaction(),
            provider.connection,
            provider.wallet,
            {
              stakePoolId: stakePoolId,
            }
          )
        ).instructions
      ),
      "Create booster"
    ).to.be.fulfilled;

    const stakeBooster = await tryGetAccount(() =>
      getStakeBooster(provider.connection, stakeBoosterId)
    );
    expect(stakeBooster).to.eq(null);
  });
});
