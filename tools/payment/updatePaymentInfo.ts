/* eslint-disable import/first, import/newline-after-import */
import * as dotenv from "dotenv";
dotenv.config();

import { connectionFor } from "@cardinal/common";
import { Wallet } from "@project-serum/anchor";
import type { Cluster, Connection } from "@solana/web3.js";
import { PublicKey, Transaction } from "@solana/web3.js";

import type { UpdatePaymentInfoIx } from "../../sdk";
import {
  createUpdatePaymentInfoInstruction,
  findPaymentInfoId,
} from "../../sdk";
import { executeTransaction, keypairFrom } from "../utils";

const wallet = keypairFrom(process.env.WALLET ?? "");
const identifier = "1-dust";
const params: UpdatePaymentInfoIx = {
  authority: wallet.publicKey,
  paymentAmount: 1 * 10 ** 9,
  paymentMint: new PublicKey("DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ"),
  paymentShares: [{ address: wallet.publicKey, basisPoints: 10000 }],
};
const cluster: Cluster | "mainnet" | "localnet" = "mainnet-beta";

const main = async (
  connection: Connection,
  wallet: Wallet,
  identifier: string,
  params: UpdatePaymentInfoIx
) => {
  const transaction = new Transaction();
  const paymentInfoId = findPaymentInfoId(identifier);
  transaction.add(
    createUpdatePaymentInfoInstruction(
      {
        paymentInfo: paymentInfoId,
        authority: wallet.publicKey,
        payer: wallet.publicKey,
      },
      { ix: params }
    )
  );
  await executeTransaction(connection, transaction, wallet);
  console.log(
    `Updated payment manager ${identifier} [${paymentInfoId.toString()}]`,
    params
  );
};

main(connectionFor(cluster), new Wallet(wallet), identifier, params).catch(
  (e) => console.log(e)
);
