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
import BN from "bn.js";

import { fetchIdlAccount } from "./accounts";
import type { PaymentShare } from "./constants";

export const BASIS_POINTS_DIVISOR = 10_000;

export const ACTION_MAP: {
  [stakePoolId: string]: {
    [action: string]: {
      paymentAmount: BN;
      paymentMint: PublicKey;
      paymentShares: PaymentShare[];
    };
  };
} = {};

export const withRemainingAccountsForAction = async (
  connection: Connection,
  transaction: Transaction,
  payer: PublicKey,
  stakePoolId: PublicKey,
  action: string
): Promise<AccountMeta[]> => {
  const defaultActionFee = ACTION_MAP[stakePoolId.toString()]?.[action] ?? {
    paymentAmount: new BN(2_000_000),
    paymentMint: PublicKey.default,
    paymentShares: [
      {
        address: new PublicKey("cteamyte8zjZTeexp3qTzvpb24TKRSL3HFad9SzNaNJ"),
        basisPoints: BASIS_POINTS_DIVISOR,
      },
    ],
  };
  return await withRemainingAccountsForPayment(
    connection,
    transaction,
    payer,
    defaultActionFee
  );
};

export const withRemainingAccountsForPaymentInfo = async (
  connection: Connection,
  transaction: Transaction,
  payer: PublicKey,
  paymentInfo: PublicKey
): Promise<AccountMeta[]> => {
  const paymentInfoData = await fetchIdlAccount(
    connection,
    paymentInfo,
    "paymentInfo"
  );
  const remainingAccounts: AccountMeta[] = [
    {
      pubkey: paymentInfo,
      isSigner: false,
      isWritable: false,
    },
  ];
  remainingAccounts.push(
    ...(await withRemainingAccountsForPayment(
      connection,
      transaction,
      payer,
      paymentInfoData.parsed
    ))
  );
  return remainingAccounts;
};

export const withRemainingAccountsForPayment = async (
  connection: Connection,
  transaction: Transaction,
  payer: PublicKey,
  config: {
    paymentAmount: BN;
    paymentMint: PublicKey;
    paymentShares: { address: PublicKey }[];
  }
): Promise<AccountMeta[]> => {
  const { paymentAmount, paymentMint, paymentShares } = config;
  if (Number(paymentAmount) === 0) {
    return [];
  }

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
      ...paymentShares.map(({ address }) => ({
        pubkey: address,
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
      pubkey: getAssociatedTokenAddressSync(paymentMint, payer, true),
      isSigner: false,
      isWritable: true,
    });
    const ataIds = paymentShares.map(({ address }) =>
      getAssociatedTokenAddressSync(paymentMint, address, true)
    );
    const tokenAccountInfos = await connection.getMultipleAccountsInfo(ataIds);
    for (let i = 0; i < tokenAccountInfos.length; i++) {
      if (!tokenAccountInfos[i]) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            payer,
            ataIds[i]!,
            paymentShares[i]!.address,
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
