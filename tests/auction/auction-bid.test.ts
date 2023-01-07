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
  bidAuction,
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
const endTimestampSeconds = Date.now() / 1000 + 5;
let provider: CardinalProvider;
let mintId: PublicKey;

jest.setTimeout(10000);

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
    .accountsStrict({
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
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const auctionId = findAuctionId(stakePoolId, auctionName);
  const tx = new Transaction();
  const ix = await rewardsCenterProgram(provider.connection, provider.wallet)
    .methods.initAuction({
      name: auctionName,
      authority: provider.wallet.publicKey,
      endTimestampSeconds: new BN(endTimestampSeconds),
    })
    .accountsStrict({
      auction: auctionId,
      stakePool: stakePoolId,
      authority: provider.wallet.publicKey,
      payer: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  tx.add(ix);
  await executeTransaction(provider.connection, tx, provider.wallet);
  const auction = await fetchIdlAccount(
    provider.connection,
    auctionId,
    "auction"
  );
  expect(auction.parsed.authority.toString()).toBe(
    provider.wallet.publicKey.toString()
  );
  expect(auction.parsed.endTimestampSeconds.toNumber()).toBeGreaterThan(
    Date.now() / 1000
  );
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
  const stakePoolId = findStakePoolId(stakePoolIdentifier);

  const tx = await bidAuction(
    provider.connection,
    provider.wallet,
    biddingAmount,
    findAuctionId(stakePoolId, auctionName),
    mintId
  );

  await expect(
    executeTransaction(provider.connection, tx, provider.wallet, {
      silent: true,
    })
  ).rejects.toThrow();
});

test("Bid on auction", async () => {
  await new Promise((r) => setTimeout(r, 2500));
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const biddingAmount = new BN(2);

  const tx = await bidAuction(
    provider.connection,
    provider.wallet,
    biddingAmount,
    findAuctionId(stakePoolId, auctionName),
    mintId
  );

  await executeTransaction(provider.connection, tx, provider.wallet);

  const auctionId = findAuctionId(stakePoolId, auctionName);
  const auctionData = await tryGetAccount(() =>
    fetchIdlAccount(provider.connection, auctionId, "auction")
  );
  const stakeEntryId = findStakeEntryId(stakePoolId, mintId);
  if (!auctionData) throw "No auction data found";
  expect(auctionData.parsed.highestBid.toString()).toEqual(
    biddingAmount.toString()
  );
  expect(auctionData.parsed.highestBiddingStakeEntry.toString()).toEqual(
    stakeEntryId.toString()
  );
});

test("Auction ended", async () => {
  await new Promise((r) => setTimeout(r, 5000));
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const biddingAmount = new BN(2);

  const tx = await bidAuction(
    provider.connection,
    provider.wallet,
    biddingAmount,
    findAuctionId(stakePoolId, auctionName),
    mintId
  );

  await expect(
    executeTransaction(provider.connection, tx, provider.wallet, {
      silent: true,
    })
  ).rejects.toThrow();
});
