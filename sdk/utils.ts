import { PAYMENT_MANAGER_ADDRESS } from "@cardinal/payment-manager";
import { getPaymentManager } from "@cardinal/payment-manager/dist/cjs/accounts";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import type {
  AccountMeta,
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";

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
