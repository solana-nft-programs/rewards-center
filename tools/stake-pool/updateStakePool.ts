import { connectionFor, executeTransaction } from "@cardinal/common";
import { utils, Wallet } from "@coral-xyz/anchor";
import type { Cluster } from "@solana/web3.js";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import dotenv from "dotenv";

import { findStakePoolId, rewardsCenterProgram } from "../../sdk";

dotenv.config();

const wallet = Keypair.fromSecretKey(
  utils.bytes.bs58.decode(process.env.WALLET || "")
); // your wallet's secret key
const stakePoolIdentifier = ``;

const main = async (cluster: Cluster) => {
  const connection = connectionFor(cluster);
  const program = rewardsCenterProgram(connection, new Wallet(wallet));
  const transaction = new Transaction();

  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const ix = await program.methods
    .updatePool({
      allowedCollections: [],
      allowedCreators: [new PublicKey("")],
      requiresAuthorization: false,
      authority: wallet.publicKey,
      resetOnUnstake: false,
      cooldownSeconds: null,
      minStakeSeconds: null,
      endDate: null,
      stakePaymentInfo: new PublicKey(""),
      unstakePaymentInfo: new PublicKey(""),
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
      `Updated pool successfully https://explorer.solana.com/tx/${txid}?cluster=${cluster}.`
    );
  } catch (e) {
    console.log("Could not update marketplace successfully.");
  }
};

main("devnet").catch((e) => console.log(e));
