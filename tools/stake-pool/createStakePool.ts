import { utils, Wallet } from "@project-serum/anchor";
import type { Cluster, PublicKey } from "@solana/web3.js";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import dotenv from "dotenv";

import {
  findStakePoolId,
  rewardsCenterProgram,
  SOL_PAYMENT_INFO,
} from "../../sdk";
import { connectionFor } from "../../tests/utils";
import { executeTransaction } from "../utils";

dotenv.config();

export type MarketplaceParams = {
  name: string;
  paymentManagerName: string;
  paymentMints?: PublicKey[];
};

const wallet = Keypair.fromSecretKey(
  utils.bytes.bs58.decode(process.env.WALLET || "")
); // your wallet's secret key
const stakePoolIdentifier = `test-name`;

const main = async (cluster: Cluster) => {
  const connection = connectionFor(cluster);
  const program = rewardsCenterProgram(connection, new Wallet(wallet));
  const transaction = new Transaction();

  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const ix = await program.methods
    .initPool({
      identifier: stakePoolIdentifier,
      allowedCollections: [],
      allowedCreators: [],
      requiresAuthorization: false,
      authority: wallet.publicKey,
      resetOnUnstake: true,
      cooldownSeconds: null,
      minStakeSeconds: null,
      endDate: null,
      stakePaymentInfo: SOL_PAYMENT_INFO,
      unstakePaymentInfo: SOL_PAYMENT_INFO,
    })
    .accounts({
      stakePool: stakePoolId,
      payer: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  transaction.add(ix);

  let txid = "";
  try {
    txid = await executeTransaction(
      connection,
      transaction,
      new Wallet(wallet)
    );
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`Transactionn failed: ${e}`);
  }

  try {
    await program.account.stakePool.fetch(stakePoolId);
    console.log(
      `Creted marketplace successfully https://explorer.solana.com/tx/${txid}?cluster=${cluster}.`
    );
  } catch (e) {
    console.log("Could not create marketplace successfully.");
  }
};

main("devnet").catch((e) => console.log(e));
