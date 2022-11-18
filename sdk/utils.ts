import { PAYMENT_MANAGER_ADDRESS } from "@cardinal/payment-manager";
import { getPaymentManager } from "@cardinal/payment-manager/dist/cjs/accounts";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type { AccountMeta, Connection, Transaction } from "@solana/web3.js";
import { PublicKey, SystemProgram } from "@solana/web3.js";

import { PaymentInfo } from "./generated";

export const withRemainingAccountsForPayment = async (
  connection: Connection,
  transaction: Transaction,
  {
    paymentManager,
    paymentMint,
    payer,
    target,
  }: {
    paymentManager: PublicKey;
    paymentMint: PublicKey;
    payer: PublicKey;
    target: PublicKey;
  }
): Promise<AccountMeta[]> => {
  const paymentManagerData = await getPaymentManager(
    connection,
    paymentManager
  );
  const payerTokenAccount = getAssociatedTokenAddressSync(paymentMint, payer);
  const targetTokenAccount = getAssociatedTokenAddressSync(paymentMint, target);
  const feeCollectorTokenAccount = getAssociatedTokenAddressSync(
    paymentMint,
    paymentManagerData.parsed.feeCollector
  );
  const [targetTokenAccountData, feeCollectorTokenAccountData] =
    await connection.getMultipleAccountsInfo([
      targetTokenAccount,
      feeCollectorTokenAccount,
    ]);
  if (!targetTokenAccountData) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        payer,
        targetTokenAccount,
        target,
        paymentMint
      )
    );
  }
  if (!feeCollectorTokenAccountData) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        payer,
        feeCollectorTokenAccount,
        paymentManagerData.parsed.feeCollector,
        paymentMint
      )
    );
  }
  return [
    {
      pubkey: paymentManager,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: payerTokenAccount,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: feeCollectorTokenAccount,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: targetTokenAccount,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: payer,
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: PAYMENT_MANAGER_ADDRESS,
      isSigner: false,
      isWritable: false,
    },
  ];
};

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
  const remaining_accounts: AccountMeta[] = [
    {
      pubkey: paymentInfo,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: payer,
      isSigner: true,
      isWritable: true,
    },
  ];

  const paymentMint = paymentInfoData.paymentMint;
  if (paymentMint === PublicKey.default) {
    remaining_accounts.push({
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    });
    remaining_accounts.push(
      ...paymentInfoData.paymentShares.map((p) => ({
        pubkey: p.address,
        isSigner: false,
        isWritable: true,
      }))
    );
  } else {
    remaining_accounts.push({
      pubkey: TOKEN_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    });
    remaining_accounts.push({
      pubkey: getAssociatedTokenAddressSync(paymentMint, payer),
      isSigner: false,
      isWritable: false,
    });
    const ataIds = paymentInfoData.paymentShares.map((p) =>
      getAssociatedTokenAddressSync(paymentMint, p.address)
    );
    const tokenAccountInfos = await connection.getMultipleAccountsInfo(ataIds);
    for (let i = 0; i < tokenAccountInfos.length; i++) {
      if (!tokenAccountInfos[i]) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            payer,
            ataIds[i]!,
            paymentInfoData.paymentShares[i]!.address,
            paymentMint
          )
        );
      }
    }
    remaining_accounts.push(
      ...ataIds.map((id) => ({
        pubkey: id,
        isSigner: false,
        isWritable: true,
      }))
    );
  }
  return remaining_accounts;
};
