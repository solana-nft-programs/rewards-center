import {
  tryGetAccount,
  withFindOrInitAssociatedTokenAccount,
} from "@cardinal/common";
import { getPaymentManager } from "@cardinal/payment-manager/dist/cjs/accounts";
import type { BN, web3 } from "@project-serum/anchor";
import type { Wallet } from "@saberhq/solana-contrib";
import type { Connection, PublicKey, Transaction } from "@solana/web3.js";

import { updateTotalStakeSeconds } from "../stakePool/instruction";
import { getReceiptManager } from "./accounts";
import {
  claimRewardReceipt,
  closeReceiptEntry,
  closeReceiptManager,
  closeRewardReceipt,
  initReceiptEntry,
  initReceiptManager,
  initRewardReceipt,
  setRewardReceiptAllowed,
  updateReceiptManager,
} from "./instruction";
import {
  findReceiptEntryId,
  findReceiptManagerId,
  findRewardReceiptId,
} from "./pda";

export const withInitReceiptManager = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    name: string;
    stakePoolId: PublicKey;
    authority: PublicKey;
    requiredStakeSeconds: BN;
    stakeSecondsToUse: BN;
    paymentMint: PublicKey;
    paymentManagerId?: PublicKey;
    paymentRecipientId: PublicKey;
    requiresAuthorization: boolean;
    maxClaimedReceipts?: BN;
  }
): Promise<[Transaction, web3.PublicKey]> => {
  const [receiptManagerId] = await findReceiptManagerId(
    params.stakePoolId,
    params.name
  );
  transaction.add(
    initReceiptManager(connection, wallet, {
      receiptManager: receiptManagerId,
      stakePoolId: params.stakePoolId,
      name: params.name,
      authority: params.authority,
      requiredStakeSeconds: params.requiredStakeSeconds,
      stakeSecondsToUse: params.stakeSecondsToUse,
      paymentMint: params.paymentMint,
      paymentManager: params.paymentManagerId,
      paymentRecipient: params.paymentRecipientId,
      requiresAuthorization: params.requiresAuthorization,
      maxClaimedReceipts: params.maxClaimedReceipts,
    })
  );
  return [transaction, receiptManagerId];
};

export const withInitReceiptEntry = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    stakeEntryId: PublicKey;
  }
): Promise<[Transaction, web3.PublicKey]> => {
  const [receiptEntryId] = await findReceiptEntryId(params.stakeEntryId);
  transaction.add(
    initReceiptEntry(connection, wallet, {
      receiptEntry: receiptEntryId,
      stakeEntry: params.stakeEntryId,
    })
  );
  return [transaction, receiptEntryId];
};

export const withInitRewardReceipt = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    receiptManagerId: PublicKey;
    receiptEntryId: PublicKey;
    stakeEntryId: PublicKey;
    payer?: PublicKey;
  }
): Promise<[Transaction, web3.PublicKey]> => {
  const [rewardReceiptId] = await findRewardReceiptId(
    params.receiptManagerId,
    params.receiptEntryId
  );
  transaction.add(
    initRewardReceipt(connection, wallet, {
      rewardReceipt: rewardReceiptId,
      receiptManager: params.receiptManagerId,
      receiptEntry: params.receiptEntryId,
      stakeEntry: params.stakeEntryId,
      payer: params.payer ?? wallet.publicKey,
    })
  );
  return [transaction, rewardReceiptId];
};

export const withUpdateReceiptManager = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    name: string;
    stakePoolId: PublicKey;
    authority: PublicKey;
    requiredStakeSeconds: BN;
    stakeSecondsToUse: BN;
    paymentMint: PublicKey;
    paymentManagerId?: PublicKey;
    paymentRecipientId: PublicKey;
    requiresAuthorization: boolean;
    maxClaimedReceipts?: BN;
  }
): Promise<[Transaction, web3.PublicKey]> => {
  const [receiptManagerId] = await findReceiptManagerId(
    params.stakePoolId,
    params.name
  );

  transaction.add(
    updateReceiptManager(connection, wallet, {
      authority: params.authority,
      requiredStakeSeconds: params.requiredStakeSeconds,
      stakeSecondsToUse: params.stakeSecondsToUse,
      receiptManager: receiptManagerId,
      paymentMint: params.paymentMint,
      paymentManager: params.paymentManagerId,
      paymentRecipient: params.paymentRecipientId,
      requiresAuthorization: params.requiresAuthorization,
      maxClaimedReceipts: params.maxClaimedReceipts ?? undefined,
    })
  );
  return [transaction, receiptManagerId];
};

export const withClaimRewardReceipt = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    receiptManagerName: string;
    stakePoolId: PublicKey;
    stakeEntryId: PublicKey;
    claimer: PublicKey;
    payer: PublicKey;
  }
): Promise<[Transaction, web3.PublicKey]> => {
  const [receiptManagerId] = await findReceiptManagerId(
    params.stakePoolId,
    params.receiptManagerName
  );
  const checkReceiptManager = await tryGetAccount(() =>
    getReceiptManager(connection, receiptManagerId)
  );
  if (!checkReceiptManager) {
    throw `No reward receipt manager found with name ${
      params.receiptManagerName
    } for pool ${params.stakePoolId.toString()}`;
  }
  const [receiptEntryId] = await findReceiptEntryId(params.stakeEntryId);

  const [rewardReceiptId] = await findRewardReceiptId(
    receiptManagerId,
    receiptEntryId
  );

  const checkPaymentManager = await tryGetAccount(() =>
    getPaymentManager(connection, checkReceiptManager.parsed.paymentManager)
  );
  if (!checkPaymentManager) {
    throw `Could not find payment manager with address ${checkReceiptManager.parsed.paymentManager.toString()}`;
  }

  const feeCollectorTokenAccountId = await withFindOrInitAssociatedTokenAccount(
    transaction,
    connection,
    checkReceiptManager.parsed.paymentMint,
    checkPaymentManager.parsed.feeCollector,
    wallet.publicKey
  );
  const paymentRecipientTokenAccountId =
    await withFindOrInitAssociatedTokenAccount(
      transaction,
      connection,
      checkReceiptManager.parsed.paymentMint,
      checkReceiptManager.parsed.paymentRecipient,
      wallet.publicKey
    );
  const payerTokenAccountId = await withFindOrInitAssociatedTokenAccount(
    transaction,
    connection,
    checkReceiptManager.parsed.paymentMint,
    params.payer,
    wallet.publicKey
  );

  transaction.add(
    updateTotalStakeSeconds(connection, wallet, {
      stakEntryId: params.stakeEntryId,
      lastStaker: params.claimer,
    })
  );

  transaction.add(
    claimRewardReceipt(connection, wallet, {
      receiptManager: receiptManagerId,
      rewardReceipt: rewardReceiptId,
      stakeEntry: params.stakeEntryId,
      receiptEntry: receiptEntryId,
      paymentManager: checkReceiptManager.parsed.paymentManager,
      feeCollectorTokenAccount: feeCollectorTokenAccountId,
      paymentRecipientTokenAccount: paymentRecipientTokenAccountId,
      payerTokenAccount: payerTokenAccountId,
      payer: params.payer,
      claimer: params.claimer,
      initializer: wallet.publicKey,
    })
  );
  return [transaction, rewardReceiptId];
};

export const withCloseReceiptManager = (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    receiptManagerId: PublicKey;
  }
): Transaction => {
  transaction.add(
    closeReceiptManager(connection, wallet, {
      receiptManager: params.receiptManagerId,
    })
  );
  return transaction;
};

export const withCloseReceiptEntry = (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    receiptManagerId: PublicKey;
    receiptEntryId: PublicKey;
    stakeEntryId: PublicKey;
  }
): Transaction => {
  transaction.add(
    closeReceiptEntry(connection, wallet, {
      receiptManager: params.receiptManagerId,
      receiptEntry: params.receiptEntryId,
      stakeEntry: params.stakeEntryId,
    })
  );
  return transaction;
};

export const withCloseRewardReceipt = (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    receiptManagerId: PublicKey;
    rewardReceiptId: PublicKey;
  }
): Transaction => {
  transaction.add(
    closeRewardReceipt(connection, wallet, {
      receiptManager: params.receiptManagerId,
      rewardReceipt: params.rewardReceiptId,
    })
  );
  return transaction;
};

export const withSetRewardReceiptAllowed = (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    receiptManagerId: PublicKey;
    rewardReceiptId: PublicKey;
    auth: boolean;
  }
): Transaction => {
  transaction.add(
    setRewardReceiptAllowed(connection, wallet, {
      auth: params.auth,
      receiptManager: params.receiptManagerId,
      rewardReceipt: params.rewardReceiptId,
    })
  );
  return transaction;
};
