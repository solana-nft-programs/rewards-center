import { findAta } from "@cardinal/common";
import { BN } from "@project-serum/anchor";
import { expectTXTable } from "@saberhq/chai-solana";
import { SolanaProvider, TransactionEnvelope } from "@saberhq/solana-contrib";
import type * as splToken from "@solana/spl-token";
import type { PublicKey, Transaction } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";
import { expect } from "chai";

import { createStakePool, stake, unstake } from "../src";
import { getStakeEntry } from "../src/programs/stakePool/accounts";
import { findStakeEntryIdFromMint } from "../src/programs/stakePool/utils";
import { createMint } from "./utils";
import { getProvider } from "./workspace";

describe("Create stake pool", () => {
  let stakePoolId: PublicKey;
  let originalMintTokenAccountId: PublicKey;
  let originalMint: splToken.Token;

  const stakingAmount = 10;
  const originalMintAuthority = Keypair.generate();

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
  });

  it("Create Pool", async () => {
    const provider = getProvider();

    let transaction: Transaction;
    [transaction, stakePoolId] = await createStakePool(
      provider.connection,
      provider.wallet,
      {
        cooldownSeconds: 10,
      }
    );

    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...transaction.instructions,
      ]),
      "Create pool"
    ).to.be.fulfilled;
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

    expect(stakeEntryData.parsed.amount.toNumber()).to.eq(stakingAmount / 2);
    expect(stakeEntryData.parsed.lastStakedAt.toNumber()).to.be.greaterThan(0);
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
      "Unstake into cooldown"
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
    expect(
      stakeEntryData.parsed.cooldownStartSeconds?.toNumber()
    ).to.be.greaterThan(0);
    expect(stakeEntryData.parsed.amount.toNumber()).to.eq(stakingAmount / 2);
    expect(stakeEntryData.parsed.lastStakedAt.toNumber()).to.be.greaterThan(0);
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
  });

  it("Stake another half during cooldown", () => {
    const provider = getProvider();
    expect(async () => {
      await expectTXTable(
        new TransactionEnvelope(SolanaProvider.init(provider), [
          ...(
            await stake(provider.connection, provider.wallet, {
              stakePoolId: stakePoolId,
              originalMintId: originalMint.publicKey,
              userOriginalMintTokenAccountId: originalMintTokenAccountId,
              amount: new BN(stakingAmount / 2),
            })
          ).instructions,
        ]),
        "Stake during cooldown"
      ).to.be.rejectedWith(Error);
    });
  });
});
