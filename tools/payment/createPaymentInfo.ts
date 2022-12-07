import type { BN, Wallet } from "@project-serum/anchor";
import type { Connection } from "@solana/web3.js";
import { PublicKey, Transaction } from "@solana/web3.js";

import { findPaymentInfoId, rewardsCenterProgram } from "../../sdk";
import { executeTransaction } from "../utils";

export const commandName = "createPaymentInfo";
export const description = "Create a payment info object";
export const getArgs = (_connection: Connection, wallet: Wallet) => ({
  identifier: "unstake-y00ts",
  authority: wallet.publicKey,
  paymentAmount: 3 * 10 ** 9,
  paymentMint: new PublicKey("DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ"),
  paymentShares: [
    {
      address: new PublicKey("cteamyte8zjZTeexp3qTzvpb24TKRSL3HFad9SzNaNJ"),
      basisPoints: 5000,
    },
    {
      address: new PublicKey("yootn8Kf22CQczC732psp7qEqxwPGSDQCFZHkzoXp25"),
      basisPoints: 5000,
    },
  ],
});

export type InitPaymentInfoIx = {
  authority: PublicKey;
  identifier: string;
  paymentAmount: BN;
  paymentMint: PublicKey;
  paymentShares: PublicKey[];
};

export const handler = async (
  connection: Connection,
  wallet: Wallet,
  args: InitPaymentInfoIx
) => {
  const transaction = new Transaction();
  const paymentInfoId = findPaymentInfoId(args.identifier);
  const program = rewardsCenterProgram(connection, wallet);

  transaction.add(
    await program.methods
      .initPaymentInfo(args)
      .accounts({ paymentInfo: paymentInfoId, payer: wallet.publicKey })
      .instruction()
  );
  await new Promise((r) => setTimeout(r, 200));
  await executeTransaction(connection, transaction, wallet);
  console.log(
    `Created payment manager ${args.identifier} [${paymentInfoId.toString()}]`,
    args
  );
};
