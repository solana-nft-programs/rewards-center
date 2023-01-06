import type { CardinalProvider } from "@cardinal/common";
import { executeTransaction, getTestProvider } from "@cardinal/common";
import { beforeAll, expect, test } from "@jest/globals";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { BN } from "bn.js";

import {
  fetchIdlAccount,
  findAuctionId,
  findStakePoolId,
  rewardsCenterProgram,
  SOL_PAYMENT_INFO,
} from "../../sdk";

const stakePoolIdentifier = `test-${Math.random()}`;
const auctionName = `test-${Math.random()}`;
const endDate = Date.now() + 5;
let provider: CardinalProvider;

beforeAll(async () => {
  provider = await getTestProvider();
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
  const program = rewardsCenterProgram(provider.connection, provider.wallet);
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const auctionId = findAuctionId(stakePoolId, auctionName);
  const tx = new Transaction();
  const ix = await program.methods
    .initAuction({
      name: auctionName,
      authority: provider.wallet.publicKey,
      endTimestampSeconds: new BN(endDate),
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

test("Update auction", async () => {
  const program = rewardsCenterProgram(provider.connection, provider.wallet);
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const auctionId = findAuctionId(stakePoolId, auctionName);
  const tx = new Transaction();
  const newAuthority = Keypair.generate().publicKey;
  const newEndDate = Date.now() / 1000 + 10;
  const ix = await program.methods
    .updateAuction({
      authority: newAuthority,
      endTimestampSeconds: new BN(newEndDate),
      completed: true,
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
  expect(auction.parsed.authority.toString()).toBe(newAuthority.toString());
  expect(auction.parsed.endTimestampSeconds.toNumber()).toBeGreaterThan(
    Date.now() / 1000
  );
  expect(auction.parsed.completed).toBeTruthy();
});