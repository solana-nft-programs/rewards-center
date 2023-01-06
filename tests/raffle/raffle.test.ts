import { beforeAll, expect, test } from "@jest/globals";
import type { PublicKey } from "@solana/web3.js";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { BN } from "bn.js";

import {
  enterRaffle,
  fetchIdlAccount,
  findRaffleId,
  findStakePoolId,
  rewardsCenterProgram,
  SOL_PAYMENT_INFO,
  stake,
} from "../../sdk";
import type { CardinalProvider } from "../utils";
import {
  createMasterEditionTx,
  executeTransaction,
  executeTransactions,
  getProvider,
} from "../utils";

const stakePoolIdentifier = `test-${Math.random()}`;
const raffleIdentifier = `raffle-${Math.random()}`;
let provider: CardinalProvider;
let mintId: PublicKey;

beforeAll(async () => {
  provider = await getProvider();
  const mintKeypair = Keypair.generate();
  mintId = mintKeypair.publicKey;
  const mintTx = await createMasterEditionTx(
    provider.connection,
    mintKeypair.publicKey,
    provider.wallet.publicKey
  );
  await executeTransaction(provider.connection, mintTx, provider.wallet, {
    signers: [mintKeypair],
  });
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

test("Stake", async () => {
  await executeTransactions(
    provider.connection,
    await stake(provider.connection, provider.wallet, stakePoolIdentifier, [
      { mintId },
    ]),
    provider.wallet
  );
});

test("Enter raffle", async () => {
  await new Promise((r) => setTimeout(r, 3000));
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const raffleId = findRaffleId(stakePoolId, raffleIdentifier);

  const txs = await enterRaffle(
    provider.connection,
    provider.wallet,
    stakePoolIdentifier,
    [{ mintId, stakeSeconds: new BN(1) }],
    raffleId
  );
  await executeTransactions(provider.connection, txs, provider.wallet);
  const raffle = await fetchIdlAccount(provider.connection, raffleId, "raffle");
  expect(raffle.parsed.raffleTickets.length).toBe(1);
});

test("Enter raffle fail", async () => {
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const raffleId = findRaffleId(stakePoolId, raffleIdentifier);
  const txs = await enterRaffle(
    provider.connection,
    provider.wallet,
    stakePoolIdentifier,
    [{ mintId, stakeSeconds: new BN(10) }],
    raffleId
  );

  await expect(
    executeTransactions(provider.connection, txs, provider.wallet)
  ).rejects.toThrow();
});
