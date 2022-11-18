import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type {
  AccountMeta,
  Connection,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { PublicKey, SystemProgram } from "@solana/web3.js";

import { PaymentInfo } from "./generated";

export const BASIS_POINTS_DIVISOR = 10_000;

export const withRemainingAccountsForPaymentInfo = async (
  connection: Connection,
  transaction: Transaction,
  payer: PublicKey,
  paymentInfo: PublicKey
): Promise<AccountMeta[]> => {
  const paymentInfoData = await PaymentInfo.fromAccountAddress(
    connection,
    paymentInfo
  );
  const remainingAccounts: AccountMeta[] = [
    {
      pubkey: paymentInfo,
      isSigner: false,
      isWritable: false,
    },
  ];

  // add payer
  if (Number(paymentInfoData.paymentAmount) === 0) return remainingAccounts;

  remainingAccounts.push(
    ...(await withRemainingAccountsForPayment(
      connection,
      transaction,
      payer,
      paymentInfoData.paymentMint,
      paymentInfoData.paymentShares.map((p) => p.address)
    ))
  );
  return remainingAccounts;
};

export const withRemainingAccountsForPayment = async (
  connection: Connection,
  transaction: Transaction,
  payer: PublicKey,
  paymentMint: PublicKey,
  paymentTargets: PublicKey[]
): Promise<AccountMeta[]> => {
  const remainingAccounts = [
    {
      pubkey: payer,
      isSigner: true,
      isWritable: true,
    },
  ];

  if (paymentMint.equals(PublicKey.default)) {
    remainingAccounts.push({
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    });
    remainingAccounts.push(
      ...paymentTargets.map((a) => ({
        pubkey: a,
        isSigner: false,
        isWritable: true,
      }))
    );
  } else {
    remainingAccounts.push({
      pubkey: TOKEN_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    });
    remainingAccounts.push({
      pubkey: getAssociatedTokenAddressSync(paymentMint, payer),
      isSigner: false,
      isWritable: true,
    });
    const ataIds = paymentTargets.map((a) =>
      getAssociatedTokenAddressSync(paymentMint, a)
    );
    const tokenAccountInfos = await connection.getMultipleAccountsInfo(ataIds);
    for (let i = 0; i < tokenAccountInfos.length; i++) {
      if (!tokenAccountInfos[i]) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            payer,
            ataIds[i]!,
            paymentTargets[i]!,
            paymentMint
          )
        );
      }
    }
    remainingAccounts.push(
      ...ataIds.map((id) => ({
        pubkey: id,
        isSigner: false,
        isWritable: true,
      }))
    );
  }
  return remainingAccounts;
};

export const withRemainingAccounts = (
  instruction: TransactionInstruction,
  remainingAccounts: AccountMeta[]
) => {
  return {
    ...instruction,
    keys: [...instruction.keys, ...remainingAccounts],
  };
};
