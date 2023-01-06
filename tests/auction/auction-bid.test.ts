import type { CardinalProvider } from "@cardinal/common";
import {
  executeTransaction,
  executeTransactions,
  getTestProvider,
  tryGetAccount,
} from "@cardinal/common";
import { beforeAll, expect, test } from "@jest/globals";
import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import type { PublicKey } from "@solana/web3.js";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { BN } from "bn.js";

import {
  bid,
  fetchIdlAccount,
  findAuctionId,
  findStakeEntryId,
  findStakePoolId,
  rewardsCenterProgram,
  SOL_PAYMENT_INFO,
  stake,
} from "../../sdk";
import { createMasterEditionTx } from "../utils";

const stakePoolIdentifier = `test-${Math.random()}`;
const auctionName = `test-${Math.random()}`;
const endDate = Date.now() / 1000 + 5;
let provider: CardinalProvider;
let mintId: PublicKey;

beforeAll(async () => {
  provider = await getTestProvider();
  const mintKeypair = Keypair.generate();
  mintId = mintKeypair.publicKey;
  await executeTransaction(
    provider.connection,
    await createMasterEditionTx(
      provider.connection,
      mintKeypair.publicKey,
      provider.wallet.publicKey
    ),
    provider.wallet,
    { signers: [mintKeypair] }
  );
});

test("Init pool", async () => {
  const program = rewardsCenterProgram(provider.connection, provider.wallet);
  const tx = new Transaction();
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const ix = await program.methods
    .initPool({
      identifier: stakePoolIdentifier,
      allowedCollections: [],
      allowedCreators: [],
      requiresAuthorization: false,
      authority: provider.wallet.publicKey,
      resetOnUnstake: false,
      cooldownSeconds: null,
      minStakeSeconds: null,
      endDate: null,
      stakePaymentInfo: SOL_PAYMENT_INFO,
      unstakePaymentInfo: SOL_PAYMENT_INFO,
    })
    .accounts({
      stakePool: stakePoolId,
      payer: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  tx.add(ix);
  await executeTransaction(provider.connection, tx, provider.wallet);
  const pool = await fetchIdlAccount(
    provider.connection,
    stakePoolId,
    "stakePool"
  );
  expect(pool.parsed.authority.toString()).toBe(
    provider.wallet.publicKey.toString()
  );
  expect(pool.parsed.requiresAuthorization).toBe(false);
  expect(pool.parsed.stakePaymentInfo.toString()).toBe(
    SOL_PAYMENT_INFO.toString()
  );
});

test("Init auction", async () => {
  const program = rewardsCenterProgram(provider.connection, provider.wallet);
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const auctionId = findAuctionId(auctionName);
  const tx = new Transaction();
  const ix = await program.methods
    .initAuction({
      name: auctionName,
      authority: provider.wallet.publicKey,
      endDate: new BN(endDate),
    })
    .accounts({
      auction: auctionId,
      stakePool: stakePoolId,
      payer: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  tx.add(ix);
  await executeTransaction(provider.connection, tx, provider.wallet);
  const auction = await fetchIdlAccount(
    provider.connection,
    stakePoolId,
    "auction"
  );
  expect(auction.parsed.authority.toString()).toBe(
    provider.wallet.publicKey.toString()
  );
  expect(auction.parsed.endDate.toString()).toEqual(endDate.toString());
  expect(auction.parsed.completed).toBeFalsy();
});

test("Stake", async () => {
  const program = rewardsCenterProgram(provider.connection, provider.wallet);
  await executeTransactions(
    provider.connection,
    await stake(provider.connection, provider.wallet, stakePoolIdentifier, [
      { mintId },
    ]),
    provider.wallet
  );

  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeEntryId = findStakeEntryId(stakePoolId, mintId);
  const userAtaId = getAssociatedTokenAddressSync(
    mintId,
    provider.wallet.publicKey
  );
  const entry = await fetchIdlAccount(
    provider.connection,
    stakeEntryId,
    "stakeEntry"
  );
  expect(entry.parsed.stakeMint.toString()).toBe(mintId.toString());
  expect(entry.parsed.lastStaker.toString()).toBe(
    provider.wallet.publicKey.toString()
  );
  expect(parseInt(entry.parsed.lastStakedAt.toString())).toBeGreaterThan(
    Date.now() / 1000 - 60
  );
  expect(parseInt(entry.parsed.lastUpdatedAt.toString())).toBeGreaterThan(
    Date.now() / 1000 - 60
  );

  const userAta = await getAccount(provider.connection, userAtaId);
  expect(userAta.isFrozen).toBe(true);
  expect(parseInt(userAta.amount.toString())).toBe(1);
  const activeStakeEntries = await program.account.stakeEntry.all([
    {
      memcmp: {
        offset: 82,
        bytes: provider.wallet.publicKey.toString(),
      },
    },
  ]);
  expect(activeStakeEntries.length).toBe(1);
});

test("Fail bid on auction", async () => {
  const biddingAmount = new BN(10);

  const tx = await bid(
    provider.connection,
    provider.wallet,
    biddingAmount,
    auctionName,
    mintId
  );

  await expect(
    executeTransaction(provider.connection, tx, provider.wallet)
  ).rejects.toThrow();
});

test("Bid on auction", async () => {
  await new Promise((r) => setTimeout(r, 2000));
  const biddingAmount = new BN(2);

  const tx = await bid(
    provider.connection,
    provider.wallet,
    biddingAmount,
    auctionName,
    mintId
  );

  await executeTransaction(provider.connection, tx, provider.wallet);

  const auctionId = findAuctionId(auctionName);
  const auctionData = await tryGetAccount(() =>
    fetchIdlAccount(provider.connection, auctionId, "auction")
  );
  if (!auctionData) throw "No auction data found";
  expect(auctionData.parsed.highestBid.toString()).toEqual("2");
  const stakePoolid = findStakePoolId(stakePoolIdentifier);
  const stakeEntryId = findStakeEntryId(stakePoolid, mintId);
  expect(auctionData.parsed.highestBid.toString()).toEqual(
    stakeEntryId.toString()
  );
});

test("Auction ended", async () => {
  await new Promise((r) => setTimeout(r, 5000));
  const biddingAmount = new BN(2);

  const tx = await bid(
    provider.connection,
    provider.wallet,
    biddingAmount,
    auctionName,
    mintId
  );

  await expect(
    executeTransaction(provider.connection, tx, provider.wallet)
  ).rejects.toThrow();
});
