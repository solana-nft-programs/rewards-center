import { withWrapSol } from "@cardinal/common";
import { beforeAll, expect, test } from "@jest/globals";
import { NATIVE_MINT } from "@solana/spl-token";
import type { PublicKey } from "@solana/web3.js";
import { Keypair, Transaction } from "@solana/web3.js";

import {
  BASIS_POINTS_DIVISOR,
  findStakeBoosterId,
  findStakePoolId,
  SOL_PAYMENT_INFO,
} from "../../sdk";
import {
  createInitPoolInstruction,
  createInitStakeBoosterInstruction,
  createUpdateStakeBoosterInstruction,
  StakeBooster,
  StakePool,
} from "../../sdk/generated";
import type { CardinalProvider } from "../utils";
import { executeTransaction, getProvider } from "../utils";

const stakePoolIdentifier = `test-${Math.random()}`;
let provider: CardinalProvider;
const PAYMENT_AMOUNT = 10;
let paymentMintId: PublicKey;
let paymentRecipientId: PublicKey;

beforeAll(async () => {
  provider = await getProvider();

  await executeTransaction(
    provider.connection,
    await withWrapSol(
      new Transaction(),
      provider.connection,
      provider.wallet,
      PAYMENT_AMOUNT
    ),
    provider.wallet
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
          stakePaymentInfo: SOL_PAYMENT_INFO,
          unstakePaymentInfo: SOL_PAYMENT_INFO,
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
          paymentShares: [
            { address: paymentRecipientId, basisPoints: BASIS_POINTS_DIVISOR },
          ],
          boostSeconds: 2,
          startTimeSeconds: 0,
          boostActionPaymentInfo: SOL_PAYMENT_INFO,
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
          paymentShares: [
            { address: paymentRecipientId, basisPoints: BASIS_POINTS_DIVISOR },
          ],
          boostSeconds: 4,
          startTimeSeconds: 4,
          boostActionPaymentInfo: SOL_PAYMENT_INFO,
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
