import type { Wallet } from "@project-serum/anchor";
import type { Connection } from "@solana/web3.js";
import { PublicKey, Transaction } from "@solana/web3.js";

import type { UpdatePaymentInfoIx } from "../../sdk";
import {
  createUpdatePaymentInfoInstruction,
  findPaymentInfoId,
} from "../../sdk";
import { executeTransaction } from "../utils";

export const commandName = "updatePaymentInfo";
export const description = "Update a payment info object";

export type Args = {
  identifier: string;
  ix: UpdatePaymentInfoIx;
};

export const getArgs = (_connection: Connection, wallet: Wallet) => ({
  identifier: "1-dust",
  ix: {
    authority: wallet.publicKey,
    paymentAmount: 1 * 10 ** 9,
    paymentMint: new PublicKey("DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ"),
    paymentShares: [{ address: wallet.publicKey, basisPoints: 10000 }],
  },
});

export const handler = async (
  connection: Connection,
  wallet: Wallet,
  args: Args
) => {
  const transaction = new Transaction();
  const paymentInfoId = findPaymentInfoId(args.identifier);
  transaction.add(
    createUpdatePaymentInfoInstruction(
      {
        paymentInfo: paymentInfoId,
        authority: wallet.publicKey,
        payer: wallet.publicKey,
      },
      { ix: args.ix }
    )
  );
  await executeTransaction(connection, transaction, wallet);
  console.log(
    `Updated payment manager ${args.identifier} [${paymentInfoId.toString()}]`,
    args.ix
  );
};
