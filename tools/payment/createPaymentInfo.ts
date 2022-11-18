/* eslint-disable import/first, import/newline-after-import */
import * as dotenv from "dotenv";
dotenv.config();

import { connectionFor } from "@cardinal/common";
import { Wallet } from "@project-serum/anchor";
import type { Cluster, Connection } from "@solana/web3.js";
import { PublicKey, Transaction } from "@solana/web3.js";

import type { InitPaymentInfoIx } from "../../sdk";
import { createInitPaymentInfoInstruction, findPaymentInfoId } from "../../sdk";
import { executeTransaction, keypairFrom } from "../utils";

const wallet = keypairFrom(process.env.WALLET ?? "");

const params: InitPaymentInfoIx = {
  identifier: "1-dust",
  authority: wallet.publicKey,
  paymentAmount: 1 * 10 ** 9,
  paymentMint: new PublicKey("DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ"),
  paymentShares: [{ address: wallet.publicKey, basisPoints: 10000 }],
};
const cluster: Cluster | "mainnet" | "localnet" = "mainnet";

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
  console.log(
    `Created payment manager ${
      params.identifier
    } [${paymentInfoId.toString()}]`,
    params
  );
};

main(connectionFor(cluster), new Wallet(wallet), params).catch((e) =>
  console.log(e)
);
