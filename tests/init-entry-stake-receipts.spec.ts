import { findAta } from "@cardinal/common";
import { expectTXTable } from "@saberhq/chai-solana";
import { SolanaProvider, TransactionEnvelope } from "@saberhq/solana-contrib";
import * as splToken from "@solana/spl-token";
import * as web3 from "@solana/web3.js";
import { expect } from "chai";

import {
  createStakeEntryAndStakeMint,
  createStakePool,
  stake,
  unstake,
} from "../src";
import { ReceiptType } from "../src/programs/stakePool";
import { getStakeEntry } from "../src/programs/stakePool/accounts";
import { findStakeEntryIdFromMint } from "../src/programs/stakePool/utils";
import { createMint } from "./utils";
import { getProvider } from "./workspace";

describe("Create stake pool", () => {
  let stakePoolId: web3.PublicKey;
  let originalMintTokenAccountId: web3.PublicKey;
  let originalMint: splToken.Token;
  let stakeMintKeypair: web3.Keypair | undefined;
  const originalMintAuthority = web3.Keypair.generate();

  before(async () => {
    const provider = getProvider();
    // original mint
    [originalMintTokenAccountId, originalMint] = await createMint(
      provider.connection,
      originalMintAuthority,
      provider.wallet.publicKey
    );
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
      new TransactionEnvelope(
        SolanaProvider.init(provider),
        transaction.instructions
      ),
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

    const stakeEntryOriginalMintTokenAccountId = await findAta(
      originalMint.publicKey,
      stakeEntryData.pubkey,
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

    const checkStakeEntryOriginalMintTokenAccount =
      await originalMint.getAccountInfo(stakeEntryOriginalMintTokenAccountId);
    expect(checkStakeEntryOriginalMintTokenAccount.amount.toNumber()).to.eq(1);

    if (!stakeMintKeypair) {
      throw new Error("stakeMintKeypair is undefined");
    }

    const receiptMint = new splToken.Token(
      provider.connection,
      stakeMintKeypair.publicKey,
      splToken.TOKEN_PROGRAM_ID,
      web3.Keypair.generate()
    );

    const [stakeEntryId] = await findStakeEntryIdFromMint(
      provider.connection,
      provider.wallet.publicKey,
      stakePoolId,
      originalMint.publicKey
    );

    const userReceiptMintTokenAccountId = await findAta(
      stakeMintKeypair.publicKey,
      provider.wallet.publicKey,
      true
    );

    const stakeEntryReceiptMintTokenAccountId = await findAta(
      stakeMintKeypair.publicKey,
      stakeEntryId,
      true
    );

    const checkUserReceiptMintTokenAccount = await receiptMint.getAccountInfo(
      userReceiptMintTokenAccountId
    );
    expect(checkUserReceiptMintTokenAccount.amount.toNumber()).to.eq(1);

    const checkStakeEntryReceiptMintTokenAccount =
      await receiptMint.getAccountInfo(stakeEntryReceiptMintTokenAccountId);
    expect(checkStakeEntryReceiptMintTokenAccount.amount.toNumber()).to.eq(0);
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

    expect(stakeEntryData.parsed.lastStakedAt.toNumber()).to.be.greaterThan(0);
    expect(stakeEntryData.parsed.lastStaker.toString()).to.eq(
      web3.PublicKey.default.toString()
    );

    const checkUserOriginalTokenAccount = await originalMint.getAccountInfo(
      userOriginalMintTokenAccountId
    );
    expect(checkUserOriginalTokenAccount.amount.toNumber()).to.eq(1);

    const checkStakeEntryOriginalMintTokenAccount =
      await originalMint.getAccountInfo(stakeEntryOriginalMintTokenAccountId);
    expect(checkStakeEntryOriginalMintTokenAccount.amount.toNumber()).to.eq(0);
  });
});
