/* eslint-disable import/first, import/newline-after-import */
import * as dotenv from "dotenv";
dotenv.config();

import { connectionFor } from "@cardinal/common";
import { Wallet } from "@project-serum/anchor";
import { NATIVE_MINT } from "@solana/spl-token";
import type { Cluster, Connection } from "@solana/web3.js";
import { LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";

import type { InitPaymentInfoIx } from "../../sdk";
import { createInitPaymentInfoInstruction, findPaymentInfoId } from "../../sdk";
import { executeTransaction, keypairFrom } from "../utils";

const wallet = keypairFrom(process.env.WALLET ?? "");

const params: InitPaymentInfoIx = {
  identifier: "cardinal-test-wsol",
  authority: wallet.publicKey,
  paymentAmount: LAMPORTS_PER_SOL,
  paymentMint: NATIVE_MINT,
  paymentShares: [{ address: wallet.publicKey, basisPoints: 10000 }],
};
const cluster: Cluster | "mainnet" | "localnet" = "devnet";

const main = async (
  connection: Connection,
  wallet: Wallet,
  params: InitPaymentInfoIx
) => {
  const transaction = new Transaction();
  const paymentInfoId = findPaymentInfoId(params.identifier);
  transaction.add(
    createInitPaymentInfoInstruction(
      { paymentInfo: paymentInfoId, payer: wallet.publicKey },
      { ix: params }
    )
  );
  await executeTransaction(connection, transaction, wallet);
  console.log(`Created payment manager ${params.identifier}`, params);
};

main(connectionFor(cluster), new Wallet(wallet), params).catch((e) =>
  console.log(e)
);
