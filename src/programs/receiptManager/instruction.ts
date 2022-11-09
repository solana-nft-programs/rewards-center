import { PAYMENT_MANAGER_ADDRESS } from "@cardinal/payment-manager";
import type { BN } from "@project-serum/anchor";
import { AnchorProvider, Program } from "@project-serum/anchor";
import type { Wallet } from "@saberhq/solana-contrib";
import { TOKEN_PROGRAM_ID } from "@saberhq/token-utils";
import type {
  Connection,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { SystemProgram } from "@solana/web3.js";

import type { RECEIPT_MANAGER_PROGRAM } from "./constants";
import {
  RECEIPT_MANAGER_ADDRESS,
  RECEIPT_MANAGER_IDL,
  RECEIPT_MANAGER_PAYMENT_MANAGER,
} from "./constants";

export const initReceiptManager = (
  connection: Connection,
  wallet: Wallet,
  params: {
    receiptManager: PublicKey;
    stakePoolId: PublicKey;
    name: string;
    authority: PublicKey;
    requiredStakeSeconds: BN;
    stakeSecondsToUse: BN;
    paymentMint: PublicKey;
    paymentManager?: PublicKey;
    paymentRecipient: PublicKey;
    requiresAuthorization: boolean;
    maxClaimedReceipts?: BN;
  }
): TransactionInstruction => {
  const provider = new AnchorProvider(connection, wallet, {});
  const receiptManagerProgram = new Program<RECEIPT_MANAGER_PROGRAM>(
    RECEIPT_MANAGER_IDL,
    RECEIPT_MANAGER_ADDRESS,
    provider
  );
  return receiptManagerProgram.instruction.initReceiptManager(
    {
      name: params.name,
      authority: params.authority,
      requiredStakeSeconds: params.requiredStakeSeconds,
      stakeSecondsToUse: params.stakeSecondsToUse,
      paymentMint: params.paymentMint,
      paymentManager: params.paymentManager ?? RECEIPT_MANAGER_PAYMENT_MANAGER,
      paymentRecipient: params.paymentRecipient,
      requiresAuthorization: params.requiresAuthorization,
      maxClaimedReceipts: params.maxClaimedReceipts ?? null,
    },
    {
      accounts: {
        receiptManager: params.receiptManager,
        stakePool: params.stakePoolId,
        payer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
    }
  );
};

export const initReceiptEntry = (
  connection: Connection,
  wallet: Wallet,
  params: {
    receiptEntry: PublicKey;
    stakeEntry: PublicKey;
  }
): TransactionInstruction => {
  const provider = new AnchorProvider(connection, wallet, {});
  const receiptManagerProgram = new Program<RECEIPT_MANAGER_PROGRAM>(
    RECEIPT_MANAGER_IDL,
    RECEIPT_MANAGER_ADDRESS,
    provider
  );
  return receiptManagerProgram.instruction.initReceiptEntry({
    accounts: {
      receiptEntry: params.receiptEntry,
      stakeEntry: params.stakeEntry,
      payer: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
  });
};

export const initRewardReceipt = (
  connection: Connection,
  wallet: Wallet,
  params: {
    rewardReceipt: PublicKey;
    receiptManager: PublicKey;
    receiptEntry: PublicKey;
    stakeEntry: PublicKey;
    payer: PublicKey;
  }
): TransactionInstruction => {
  const provider = new AnchorProvider(connection, wallet, {});
  const receiptManagerProgram = new Program<RECEIPT_MANAGER_PROGRAM>(
    RECEIPT_MANAGER_IDL,
    RECEIPT_MANAGER_ADDRESS,
    provider
  );
  return receiptManagerProgram.instruction.initRewardReceipt({
    accounts: {
      rewardReceipt: params.rewardReceipt,
      receiptManager: params.receiptManager,
      receiptEntry: params.receiptEntry,
      stakeEntry: params.stakeEntry,
      payer: params.payer,
      systemProgram: SystemProgram.programId,
    },
  });
};

export const updateReceiptManager = (
  connection: Connection,
  wallet: Wallet,
  params: {
    authority: PublicKey;
    requiredStakeSeconds: BN;
    stakeSecondsToUse: BN;
    receiptManager: PublicKey;
    paymentMint: PublicKey;
    paymentManager?: PublicKey;
    paymentRecipient: PublicKey;
    requiresAuthorization: boolean;
    maxClaimedReceipts?: BN;
  }
): TransactionInstruction => {
  const provider = new AnchorProvider(connection, wallet, {});
  const receiptManagerProgram = new Program<RECEIPT_MANAGER_PROGRAM>(
    RECEIPT_MANAGER_IDL,
    RECEIPT_MANAGER_ADDRESS,
    provider
  );
  return receiptManagerProgram.instruction.updateReceiptManager(
    {
      authority: params.authority,
      requiredStakeSeconds: params.requiredStakeSeconds,
      stakeSecondsToUse: params.stakeSecondsToUse,
      paymentMint: params.paymentMint,
      paymentManager: params.paymentManager ?? RECEIPT_MANAGER_PAYMENT_MANAGER,
      paymentRecipient: params.paymentRecipient,
      requiresAuthorization: params.requiresAuthorization,
      maxClaimedReceipts: params.maxClaimedReceipts ?? null,
    },
    {
      accounts: {
        receiptManager: params.receiptManager,
        authority: wallet.publicKey,
      },
    }
  );
};

export const claimRewardReceipt = (
  connection: Connection,
  wallet: Wallet,
  params: {
    receiptManager: PublicKey;
    rewardReceipt: PublicKey;
    stakeEntry: PublicKey;
    receiptEntry: PublicKey;
    paymentManager: PublicKey;
    feeCollectorTokenAccount: PublicKey;
    paymentRecipientTokenAccount: PublicKey;
    payerTokenAccount: PublicKey;
    payer: PublicKey;
    claimer: PublicKey;
    initializer: PublicKey;
  }
): TransactionInstruction => {
  const provider = new AnchorProvider(connection, wallet, {});
  const receiptManagerProgram = new Program<RECEIPT_MANAGER_PROGRAM>(
    RECEIPT_MANAGER_IDL,
    RECEIPT_MANAGER_ADDRESS,
    provider
  );
  return receiptManagerProgram.instruction.claimRewardReceipt({
    accounts: {
      rewardReceipt: params.rewardReceipt,
      receiptManager: params.receiptManager,
      stakeEntry: params.stakeEntry,
      receiptEntry: params.receiptEntry,
      paymentManager: params.paymentManager,
      feeCollectorTokenAccount: params.feeCollectorTokenAccount,
      paymentRecipientTokenAccount: params.paymentRecipientTokenAccount,
      payerTokenAccount: params.payerTokenAccount,
      payer: params.payer,
      claimer: params.claimer,
      cardinalPaymentManager: PAYMENT_MANAGER_ADDRESS,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    },
  });
};

export const closeReceiptManager = (
  connection: Connection,
  wallet: Wallet,
  params: {
    receiptManager: PublicKey;
  }
): TransactionInstruction => {
  const provider = new AnchorProvider(connection, wallet, {});
  const receiptManagerProgram = new Program<RECEIPT_MANAGER_PROGRAM>(
    RECEIPT_MANAGER_IDL,
    RECEIPT_MANAGER_ADDRESS,
    provider
  );
  return receiptManagerProgram.instruction.closeReceiptManager({
    accounts: {
      receiptManager: params.receiptManager,
      authority: wallet.publicKey,
    },
  });
};

export const closeReceiptEntry = (
  connection: Connection,
  wallet: Wallet,
  params: {
    receiptManager: PublicKey;
    receiptEntry: PublicKey;
    stakeEntry: PublicKey;
  }
): TransactionInstruction => {
  const provider = new AnchorProvider(connection, wallet, {});
  const receiptManagerProgram = new Program<RECEIPT_MANAGER_PROGRAM>(
    RECEIPT_MANAGER_IDL,
    RECEIPT_MANAGER_ADDRESS,
    provider
  );
  return receiptManagerProgram.instruction.closeReceiptEntry({
    accounts: {
      receiptEntry: params.receiptEntry,
      receiptManager: params.receiptManager,
      stakeEntry: params.stakeEntry,
      authority: wallet.publicKey,
    },
  });
};

export const closeRewardReceipt = (
  connection: Connection,
  wallet: Wallet,
  params: {
    receiptManager: PublicKey;
    rewardReceipt: PublicKey;
  }
): TransactionInstruction => {
  const provider = new AnchorProvider(connection, wallet, {});
  const receiptManagerProgram = new Program<RECEIPT_MANAGER_PROGRAM>(
    RECEIPT_MANAGER_IDL,
    RECEIPT_MANAGER_ADDRESS,
    provider
  );
  return receiptManagerProgram.instruction.closeRewardReceipt({
    accounts: {
      rewardReceipt: params.rewardReceipt,
      receiptManager: params.receiptManager,
      authority: wallet.publicKey,
    },
  });
};

export const setRewardReceiptAllowed = (
  connection: Connection,
  wallet: Wallet,
  params: {
    auth: boolean;
    receiptManager: PublicKey;
    rewardReceipt: PublicKey;
  }
): TransactionInstruction => {
  const provider = new AnchorProvider(connection, wallet, {});
  const receiptManagerProgram = new Program<RECEIPT_MANAGER_PROGRAM>(
    RECEIPT_MANAGER_IDL,
    RECEIPT_MANAGER_ADDRESS,
    provider
  );
  return receiptManagerProgram.instruction.setRewardReceiptAllowed(
    params.auth,
    {
      accounts: {
        receiptManager: params.receiptManager,
        rewardReceipt: params.rewardReceipt,
        authority: wallet.publicKey,
      },
    }
  );
};
