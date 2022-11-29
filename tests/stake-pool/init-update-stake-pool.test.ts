import { beforeAll, expect, test } from "@jest/globals";
import { Transaction } from "@solana/web3.js";

import { findStakePoolId, SOL_PAYMENT_INFO } from "../../sdk";
import {
  createInitPoolInstruction,
  createUpdatePoolInstruction,
  StakePool,
} from "../../sdk/generated";
import type { CardinalProvider } from "../utils";
import { executeTransaction, getProvider } from "../utils";

const stakePoolIdentifier = `test-${Math.random()}`;
let provider: CardinalProvider;
beforeAll(async () => {
  provider = await getProvider();
});

test("Init", async () => {
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

test("Update", async () => {
  const tx = new Transaction();
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  tx.add(
    createUpdatePoolInstruction(
      {
        stakePool: stakePoolId,
        authority: provider.wallet.publicKey,
        payer: provider.wallet.publicKey,
      },
      {
        ix: {
          allowedCollections: [],
          allowedCreators: [],
          requiresAuthorization: true,
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
  expect(pool.requiresAuthorization).toBe(true);
});
