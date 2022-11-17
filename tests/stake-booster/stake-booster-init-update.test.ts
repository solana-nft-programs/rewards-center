import { withWrapSol } from "@cardinal/common";
import { beforeAll, expect, test } from "@jest/globals";
import { NATIVE_MINT } from "@solana/spl-token";
import type { PublicKey } from "@solana/web3.js";
import { Keypair, Transaction } from "@solana/web3.js";

import {
  findStakeBoosterId,
  findStakePoolId,
  STAKE_BOOSTER_PAYMENT_MANAGER_ID,
} from "../../sdk";
import {
  createInitPoolInstruction,
  createInitStakeBoosterInstruction,
  createUpdateStakeBoosterInstruction,
  StakeBooster,
  StakePool,
} from "../../sdk/generated";
import type { CardinalProvider } from "../utils";
import {
  createMasterEditionTx,
  executeTransaction,
  getProvider,
} from "../utils";

const stakePoolIdentifier = `test-${Math.random()}`;
let provider: CardinalProvider;
const STARTING_AMOUNT = 100;
const PAYMENT_AMOUNT = 10;
let mintId: PublicKey;
let paymentMintId: PublicKey;
let paymentRecipientId: PublicKey;

beforeAll(async () => {
  provider = await getProvider();
  const mintKeypair = Keypair.generate();
  mintId = mintKeypair.publicKey;
  const mintTx = await createMasterEditionTx(
    provider.connection,
    mintKeypair.publicKey,
    provider.wallet.publicKey
  );
  await executeTransaction(
    provider.connection,
    await withWrapSol(
      new Transaction().add(...mintTx.instructions),
      provider.connection,
      provider.wallet,
      STARTING_AMOUNT
    ),
    provider.wallet,
    [mintKeypair]
  );

  paymentMintId = NATIVE_MINT;
  paymentRecipientId = Keypair.generate().publicKey;
});

test("Init pool", async () => {
  const tx = new Transaction();
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  tx.add(
    createInitPoolInstruction(
      {
        stakePool: stakePoolId,
        payer: provider.wallet.publicKey,
      },
      {
        ix: {
          identifier: stakePoolIdentifier,
          allowedCollections: [],
          allowedCreators: [],
          requiresAuthorization: false,
          authority: provider.wallet.publicKey,
          resetOnUnstake: false,
          cooldownSeconds: null,
          minStakeSeconds: null,
          endDate: null,
          stakePaymentAmount: null,
          unstakePaymentAmount: null,
          paymentMint: null,
          paymentManager: null,
          paymentRecipient: null,
        },
      }
    )
  );
  await executeTransaction(provider.connection, tx, provider.wallet);
  const pool = await StakePool.fromAccountAddress(
    provider.connection,
    stakePoolId
  );
  expect(pool.authority.toString()).toBe(provider.wallet.publicKey.toString());
  expect(pool.requiresAuthorization).toBe(false);
});

test("Create stake booster", async () => {
  const tx = new Transaction();
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeBoosterId = findStakeBoosterId(stakePoolId);
  tx.add(
    createInitStakeBoosterInstruction(
      {
        stakeBooster: stakeBoosterId,
        stakePool: stakePoolId,
        authority: provider.wallet.publicKey,
        payer: provider.wallet.publicKey,
      },
      {
        ix: {
          identifier: 0,
          stakePool: stakePoolId,
          paymentAmount: PAYMENT_AMOUNT,
          paymentMint: paymentMintId,
          paymentManager: STAKE_BOOSTER_PAYMENT_MANAGER_ID,
          paymentRecipient: paymentRecipientId,
          boostSeconds: 2,
          startTimeSeconds: 0,
        },
      }
    )
  );
  await executeTransaction(provider.connection, tx, provider.wallet);
  const stakeBooster = await StakeBooster.fromAccountAddress(
    provider.connection,
    stakeBoosterId
  );
  expect(stakeBooster.paymentMint.toString()).toBe(paymentMintId.toString());
  expect(Number(stakeBooster.boostSeconds)).toBe(2);
  expect(Number(stakeBooster.paymentAmount)).toBe(PAYMENT_AMOUNT);
});

test("Update stake booster", async () => {
  const tx = new Transaction();
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeBoosterId = findStakeBoosterId(stakePoolId);
  tx.add(
    createUpdateStakeBoosterInstruction(
      {
        stakeBooster: stakeBoosterId,
        stakePool: stakePoolId,
        authority: provider.wallet.publicKey,
      },
      {
        ix: {
          paymentAmount: PAYMENT_AMOUNT,
          paymentMint: paymentMintId,
          paymentManager: STAKE_BOOSTER_PAYMENT_MANAGER_ID,
          paymentRecipient: paymentRecipientId,
          boostSeconds: 4,
          startTimeSeconds: 4,
        },
      }
    )
  );
  await executeTransaction(provider.connection, tx, provider.wallet);
  const stakeBooster = await StakeBooster.fromAccountAddress(
    provider.connection,
    stakeBoosterId
  );
  expect(stakeBooster.paymentMint.toString()).toBe(paymentMintId.toString());
  expect(Number(stakeBooster.boostSeconds)).toBe(4);
  expect(Number(stakeBooster.startTimeSeconds)).toBe(4);
  expect(Number(stakeBooster.paymentAmount)).toBe(PAYMENT_AMOUNT);
});
