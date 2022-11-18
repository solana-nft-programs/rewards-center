/* eslint-disable import/first, import/newline-after-import */
import * as dotenv from "dotenv";
dotenv.config();

import { connectionFor } from "@cardinal/common";
import { Wallet } from "@project-serum/anchor";
import type { Cluster, Connection } from "@solana/web3.js";
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";

import type { UpdatePaymentInfoIx } from "../../sdk";
import {
  createUpdatePaymentInfoInstruction,
  findPaymentInfoId,
} from "../../sdk";
import { executeTransaction, keypairFrom } from "../utils";

const wallet = keypairFrom(process.env.WALLET ?? "");
const identifier = "cardinal-test";
const params: UpdatePaymentInfoIx = {
  authority: wallet.publicKey,
  paymentAmount: LAMPORTS_PER_SOL,
  paymentMint: PublicKey.default,
  paymentShares: [{ address: wallet.publicKey, basisPoints: 10000 }],
};
const cluster: Cluster | "mainnet" | "localnet" = "devnet";

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
  console.log(`Updated payment manager ${identifier}`, params);
};

main(connectionFor(cluster), new Wallet(wallet), identifier, params).catch(
  (e) => console.log(e)
);
