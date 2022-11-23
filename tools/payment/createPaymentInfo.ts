import type { Wallet } from "@project-serum/anchor";
import type { Connection } from "@solana/web3.js";
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";

import type { InitPaymentInfoIx } from "../../sdk";
import { createInitPaymentInfoInstruction, findPaymentInfoId } from "../../sdk";
import { executeTransaction } from "../utils";

export const commandName = "createPaymentInfo";
export const description = "Create a payment info object";
export const getArgs = (_connection: Connection, wallet: Wallet) => ({
  identifier: "claim-rewards-0",
  authority: wallet.publicKey,
  paymentAmount: 0.002 * LAMPORTS_PER_SOL,
  paymentMint: PublicKey.default,
  paymentShares: [{ address: wallet.publicKey, basisPoints: 10000 }],
});

export const handler = async (
  connection: Connection,
  wallet: Wallet,
  args: InitPaymentInfoIx
) => {
  const transaction = new Transaction();
  const paymentInfoId = findPaymentInfoId(args.identifier);
  transaction.add(
    createInitPaymentInfoInstruction(
      { paymentInfo: paymentInfoId, payer: wallet.publicKey },
      { ix: args }
    )
  );
  await new Promise((r) => setTimeout(r, 200));
  await executeTransaction(connection, transaction, wallet);
  console.log(
    `Created payment manager ${args.identifier} [${paymentInfoId.toString()}]`,
    args
  );
};
