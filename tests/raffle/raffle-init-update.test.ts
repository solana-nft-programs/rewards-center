import type { CardinalProvider } from "@cardinal/common";
import { executeTransaction, getTestProvider } from "@cardinal/common";
import { beforeAll, expect, test } from "@jest/globals";
import { SystemProgram, Transaction } from "@solana/web3.js";
import { BN } from "bn.js";

import {
  fetchIdlAccount,
  findRaffleId,
  findStakePoolId,
  rewardsCenterProgram,
  SOL_PAYMENT_INFO,
} from "../../sdk";

const stakePoolIdentifier = `test-${Math.random()}`;
const raffleIdentifier = `raffle-${Math.random()}`;
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

test("Create raffle", async () => {
  const tx = new Transaction();
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const raffleId = findRaffleId(stakePoolId, raffleIdentifier);

  const ix = await rewardsCenterProgram(provider.connection, provider.wallet)
    .methods.initRaffle({
      authority: provider.wallet.publicKey,
      stakePool: stakePoolId,
      totalWinners: new BN(1),
      minStakeSecondsToUse: new BN(0),
      maxStakeSecondsToUse: new BN(10),
      endDate: new BN(0),
      name: raffleIdentifier,
    })
    .accounts({
      raffle: raffleId,
      stakePool: stakePoolId,
      authority: provider.wallet.publicKey,
      payer: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  tx.add(ix);

  await executeTransaction(provider.connection, tx, provider.wallet);
  const raffle = await fetchIdlAccount(provider.connection, raffleId, "raffle");
  expect(Number(raffle.parsed.winnerCount)).toBe(0);
  expect(Number(raffle.parsed.totalWinners)).toBe(1);
  expect(Number(raffle.parsed.minStakeSecondsToUse)).toBe(0);
  expect(Number(raffle.parsed.maxStakeSecondsToUse)).toBe(10);
});

test("Update raffle", async () => {
  const tx = new Transaction();
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const raffleId = findRaffleId(stakePoolId, raffleIdentifier);

  const ix = await rewardsCenterProgram(provider.connection, provider.wallet)
    .methods.updateRaffle({
      authority: provider.wallet.publicKey,
      totalWinners: new BN(2),
      minStakeSecondsToUse: new BN(0),
      maxStakeSecondsToUse: new BN(20),
      endDate: new BN(0),
    })
    .accounts({
      raffle: raffleId,
      stakePool: stakePoolId,
      authority: provider.wallet.publicKey,
      payer: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  tx.add(ix);

  await executeTransaction(provider.connection, tx, provider.wallet);
  const raffle = await fetchIdlAccount(provider.connection, raffleId, "raffle");
  expect(Number(raffle.parsed.winnerCount)).toBe(0);
  expect(Number(raffle.parsed.totalWinners)).toBe(2);
  expect(Number(raffle.parsed.minStakeSecondsToUse)).toBe(0);
  expect(Number(raffle.parsed.maxStakeSecondsToUse)).toBe(20);
});
