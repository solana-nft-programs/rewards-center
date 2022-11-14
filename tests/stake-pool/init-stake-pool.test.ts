import { beforeAll, expect, test } from "@jest/globals";
import { BN } from "@project-serum/anchor";
import { Transaction } from "@solana/web3.js";

import { findStakePoolId, stakePool } from "../../sdk";
import type { CardinalProvider } from "../utils";
import { executeTransaction, getProvider } from "../utils";

let provider: CardinalProvider;
beforeAll(async () => {
  provider = await getProvider();
});

test("Init", async () => {
  const tx = new Transaction();
  const stakePoolId = findStakePoolId(new BN(0));

  tx.add(
    stakePool.createInitPoolInstruction(
      {
        stakePool: stakePoolId,
        identifier: stakePoolId,
        payer: provider.wallet.publicKey,
      },
      {
        ix: {
          requiresCollections: [],
          requiresCreators: [],
          requiresAuthorization: false,
          authority: provider.wallet.publicKey,
          resetOnUnstake: false,
          cooldownSeconds: null,
          minStakeSeconds: null,
          endDate: null,
          paymentAmount: null,
          paymentMint: null,
          paymentManager: null,
        },
      }
    )
  );
  await executeTransaction(provider.connection, tx, provider.wallet);
  const pool = await stakePool.StakePool.fromAccountAddress(
    provider.connection,
    stakePoolId
  );
  expect(pool.authority.toString()).toBe(provider.wallet.publicKey.toString());
});
