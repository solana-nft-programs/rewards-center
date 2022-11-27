import type { Wallet } from "@project-serum/anchor";
import type { Connection } from "@solana/web3.js";
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";

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
  identifier: "claim-rewards-y00ts",
  ix: {
    authority: wallet.publicKey,
    paymentAmount: 0.002 * LAMPORTS_PER_SOL,
    paymentMint: PublicKey.default,
    paymentShares: [
      {
        address: new PublicKey("cteamyte8zjZTeexp3qTzvpb24TKRSL3HFad9SzNaNJ"),
        basisPoints: 5000,
      },
      {
        address: new PublicKey("AxFuniPo7RaDgPH6Gizf4GZmLQFc4M5ipckeeZfkrPNn"),
        basisPoints: 5000,
      },
    ],
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
