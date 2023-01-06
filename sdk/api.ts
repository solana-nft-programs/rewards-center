import { withFindOrInitAssociatedTokenAccount } from "@cardinal/common";
import {
  findMintManagerId,
  MintManager,
  PROGRAM_ID as CREATOR_STANDARD_PROGRAM_ID,
} from "@cardinal/creator-standard";
import type { Wallet } from "@coral-xyz/anchor/dist/cjs/provider";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type { Connection, PublicKey } from "@solana/web3.js";
import { SystemProgram, Transaction } from "@solana/web3.js";
import BN from "bn.js";

import { fetchIdlAccountDataById } from "./accounts";
import type { PaymentShare } from "./constants";
import { rewardsCenterProgram } from "./constants";
import {
  withRemainingAccountsForPayment,
  withRemainingAccountsForPaymentInfo,
} from "./payment";
import {
  findRewardEntryId,
  findRewardReceiptId,
  findStakeBoosterId,
  findStakeEntryId,
  findStakePoolId,
  findUserEscrowId,
} from "./pda";
import {
  findMintEditionId,
  findMintMetadataId,
  METADATA_PROGRAM_ID,
} from "./utils";

/**
 * Stake all mints and also initialize entries if not already initialized
 *
 * @param connection
 * @param wallet
 * @param stakePoolIdentifier
 * @param mintInfos
 * @returns
 */
export const stake = async (
  connection: Connection,
  wallet: Wallet,
  stakePoolIdentifier: string,
  mintInfos: {
    mintId: PublicKey;
    amount?: BN;
    fungible?: boolean;
  }[]
) => {
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const mints = mintInfos.map(({ mintId, amount, fungible }) => {
    const stakeEntryId = findStakeEntryId(
      stakePoolId,
      mintId,
      fungible ? wallet.publicKey : undefined
    );
    return {
      mintId,
      stakeEntryId,
      amount,
    };
  });
  const accountDataById = await fetchIdlAccountDataById(connection, [
    stakePoolId,
    ...mints.map((m) => m.stakeEntryId),
    ...mints.map((m) => findMintManagerId(m.mintId)),
  ]);
  const stakePoolData = accountDataById[stakePoolId.toString()];
  if (!stakePoolData?.parsed || stakePoolData.type !== "stakePool") {
    throw "Stake pool not found";
  }

  const txs: Transaction[] = [];
  for (const { mintId, stakeEntryId, amount } of mints) {
    const tx = new Transaction();
    const metadataId = findMintMetadataId(mintId);
    const mintManagerId = findMintManagerId(mintId);

    if (!accountDataById[stakeEntryId.toString()]) {
      const ix = await rewardsCenterProgram(connection, wallet)
        .methods.initEntry(wallet.publicKey)
        .accounts({
          stakeEntry: stakeEntryId,
          stakePool: stakePoolId,
          stakeMint: mintId,
          stakeMintMetadata: metadataId,
          payer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      tx.add(ix);
    }

    const userEscrowId = findUserEscrowId(wallet.publicKey);
    const userAtaId = getAssociatedTokenAddressSync(
      mintId,
      wallet.publicKey,
      true
    );

    const mintManagerAccountInfo = accountDataById[mintManagerId.toString()];
    if (mintManagerAccountInfo?.data) {
      const mintManager = MintManager.fromAccountInfo(
        mintManagerAccountInfo
      )[0];
      const stakeIx = await rewardsCenterProgram(connection, wallet)
        .methods.stakeCcs(new BN(amount ?? 1))
        .accounts({
          stakePool: stakePoolId,
          stakeEntry: stakeEntryId,
          stakeMint: mintId,
          stakeMintMetadata: metadataId,
          stakeMintManager: mintManagerId,
          stakeMintManagerRuleset: mintManager.ruleset,
          user: wallet.publicKey,
          userEscrow: userEscrowId,
          userStakeMintTokenAccount: userAtaId,
          creatorStandardProgram: CREATOR_STANDARD_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts(
          await withRemainingAccountsForPaymentInfo(
            connection,
            tx,
            wallet.publicKey,
            stakePoolData.parsed.stakePaymentInfo
          )
        )
        .instruction();
      tx.add(stakeIx);
    } else {
      const editionId = findMintEditionId(mintId);
      const stakeIx = await rewardsCenterProgram(connection, wallet)
        .methods.stakeEdition(new BN(amount ?? 1))
        .accounts({
          stakePool: stakePoolId,
          stakeEntry: stakeEntryId,
          stakeMint: mintId,
          stakeMintEdition: editionId,
          stakeMintMetadata: metadataId,
          user: wallet.publicKey,
          userEscrow: userEscrowId,
          userStakeMintTokenAccount: userAtaId,
          tokenMetadataProgram: METADATA_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts(
          await withRemainingAccountsForPaymentInfo(
            connection,
            tx,
            wallet.publicKey,
            stakePoolData.parsed.stakePaymentInfo
          )
        )
        .instruction();
      tx.add(stakeIx);
    }
    txs.push(tx);
  }
  return txs;
};

/**
 * Unstake all mints and also claim rewards from any specified reward distributor(s)
 *
 * @param connection
 * @param wallet
 * @param stakePoolIdentifier
 * @param mintInfos
 * @param rewardDistributorIds
 * @returns
 */
export const unstake = async (
  connection: Connection,
  wallet: Wallet,
  stakePoolIdentifier: string,
  mintInfos: {
    mintId: PublicKey;
    fungible?: boolean;
  }[],
  rewardDistributorIds?: PublicKey[]
) => {
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const mints = mintInfos.map(({ mintId, fungible }) => {
    const stakeEntryId = findStakeEntryId(
      stakePoolId,
      mintId,
      fungible ? wallet.publicKey : undefined
    );
    return {
      mintId,
      stakeEntryId,
      rewardEntryIds: rewardDistributorIds?.map((rewardDistributorId) =>
        findRewardEntryId(rewardDistributorId, stakeEntryId)
      ),
    };
  });

  const accountDataById = await fetchIdlAccountDataById(connection, [
    stakePoolId,
    ...(rewardDistributorIds ?? []),
    ...mints.map((m) => m.rewardEntryIds ?? []).flat(),
    ...mints.map((m) => findMintManagerId(m.mintId)),
  ]);
  const stakePoolData = accountDataById[stakePoolId.toString()];

  const txs: Transaction[] = [];
  for (const { mintId, stakeEntryId, rewardEntryIds } of mints) {
    const tx = new Transaction();
    const userEscrowId = findUserEscrowId(wallet.publicKey);
    const userAtaId = getAssociatedTokenAddressSync(mintId, wallet.publicKey);

    if (
      rewardEntryIds &&
      rewardDistributorIds &&
      rewardDistributorIds?.length > 0
    ) {
      const ix = await rewardsCenterProgram(connection, wallet)
        .methods.updateTotalStakeSeconds()
        .accounts({
          stakeEntry: stakeEntryId,
          updater: wallet.publicKey,
        })
        .instruction();
      tx.add(ix);
      for (let j = 0; j < rewardDistributorIds.length; j++) {
        const rewardDistributorId = rewardDistributorIds[j]!;
        const rewardDistributorData =
          accountDataById[rewardDistributorId.toString()];
        const rewardEntryId = rewardEntryIds[j];
        if (
          rewardEntryId &&
          rewardDistributorData &&
          rewardDistributorData.type === "rewardDistributor"
        ) {
          const rewardMint = rewardDistributorData.parsed.rewardMint;
          const rewardEntry = accountDataById[rewardEntryId?.toString()];
          const rewardDistributorTokenAccount = getAssociatedTokenAddressSync(
            rewardMint,
            rewardDistributorId,
            true
          );
          const userRewardMintTokenAccount =
            await withFindOrInitAssociatedTokenAccount(
              tx,
              connection,
              rewardMint,
              wallet.publicKey,
              wallet.publicKey
            );
          if (!rewardEntry) {
            const ix = await rewardsCenterProgram(connection, wallet)
              .methods.initRewardEntry()
              .accounts({
                rewardEntry: findRewardEntryId(
                  rewardDistributorId,
                  stakeEntryId
                ),
                rewardDistributor: rewardDistributorId,
                stakeEntry: stakeEntryId,
                payer: wallet.publicKey,
              })
              .instruction();
            tx.add(ix);
          }
          const remainingAccountsForPayment =
            await withRemainingAccountsForPaymentInfo(
              connection,
              tx,
              wallet.publicKey,
              rewardDistributorData.parsed.claimRewardsPaymentInfo
            );
          const ix = await rewardsCenterProgram(connection, wallet)
            .methods.claimRewards()
            .accounts({
              rewardEntry: findRewardEntryId(rewardDistributorId, stakeEntryId),
              rewardDistributor: rewardDistributorId,
              stakeEntry: stakeEntryId,
              stakePool: stakePoolId,
              rewardMint: rewardMint,
              userRewardMintTokenAccount: userRewardMintTokenAccount,
              rewardDistributorTokenAccount: rewardDistributorTokenAccount,
              user: wallet.publicKey,
            })
            .remainingAccounts(remainingAccountsForPayment)
            .instruction();
          tx.add(ix);
        }
      }
    }

    const remainingAccounts = [];
    if (
      stakePoolData?.type === "stakePool" &&
      stakePoolData.parsed.unstakePaymentInfo
    ) {
      const remainingAccountsForPayment =
        await withRemainingAccountsForPaymentInfo(
          connection,
          tx,
          wallet.publicKey,
          stakePoolData.parsed.unstakePaymentInfo
        );
      remainingAccounts.push(...remainingAccountsForPayment);
    }

    const mintManagerId = findMintManagerId(mintId);
    const mintManagerAccountInfo = accountDataById[mintManagerId.toString()];
    if (mintManagerAccountInfo?.data) {
      const ix = await rewardsCenterProgram(connection, wallet)
        .methods.unstakeCcs()
        .accounts({
          stakeEntry: stakeEntryId,
          stakePool: stakePoolId,
          stakeMint: mintId,
          stakeMintManager: mintManagerId,
          user: wallet.publicKey,
          userEscrow: userEscrowId,
          userStakeMintTokenAccount: userAtaId,
          creatorStandardProgram: CREATOR_STANDARD_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccounts)
        .instruction();
      tx.add(ix);
    } else {
      const editionId = findMintEditionId(mintId);
      const ix = await rewardsCenterProgram(connection, wallet)
        .methods.unstakeEdition()
        .accounts({
          stakeEntry: stakeEntryId,
          stakePool: stakePoolId,
          stakeMint: mintId,
          stakeMintEdition: editionId,
          user: wallet.publicKey,
          userEscrow: userEscrowId,
          userStakeMintTokenAccount: userAtaId,
          tokenMetadataProgram: METADATA_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccounts)
        .instruction();
      tx.add(ix);
    }
    txs.push(tx);
  }
  return txs;
};

/**
 * Claim reward for all mints from any specified reward distributor(s)
 *
 * @param connection
 * @param wallet
 * @param stakePoolIdentifier
 * @param mintInfos
 * @param rewardDistributorIds
 * @returns
 */
export const claimRewards = async (
  connection: Connection,
  wallet: Wallet,
  stakePoolIdentifier: string,
  mintInfos: {
    mintId: PublicKey;
    fungible?: boolean;
  }[],
  rewardDistributorIds?: PublicKey[]
) => {
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const mints = mintInfos.map(({ mintId, fungible }) => {
    const stakeEntryId = findStakeEntryId(
      stakePoolId,
      mintId,
      fungible ? wallet.publicKey : undefined
    );
    return {
      mintId,
      stakeEntryId,
      rewardEntryIds: rewardDistributorIds?.map((rewardDistributorId) =>
        findRewardEntryId(rewardDistributorId, stakeEntryId)
      ),
    };
  });

  const accountDataById = await fetchIdlAccountDataById(connection, [
    ...(rewardDistributorIds ?? []),
    ...mints.map((m) => m.rewardEntryIds ?? []).flat(),
  ]);
  const txs: Transaction[] = [];

  for (const { stakeEntryId, rewardEntryIds } of mints) {
    const tx = new Transaction();
    if (
      rewardEntryIds &&
      rewardDistributorIds &&
      rewardDistributorIds?.length > 0
    ) {
      const ix = await rewardsCenterProgram(connection, wallet)
        .methods.updateTotalStakeSeconds()
        .accounts({
          stakeEntry: stakeEntryId,
          updater: wallet.publicKey,
        })
        .instruction();
      tx.add(ix);
      for (let j = 0; j < rewardDistributorIds.length; j++) {
        const rewardDistributorId = rewardDistributorIds[j]!;
        const rewardDistributorData =
          accountDataById[rewardDistributorId.toString()];
        const rewardEntryId = rewardEntryIds[j];
        if (
          rewardEntryId &&
          rewardDistributorData &&
          rewardDistributorData.type === "rewardDistributor"
        ) {
          const rewardMint = rewardDistributorData.parsed.rewardMint;
          const rewardEntry = accountDataById[rewardEntryId?.toString()];
          const rewardDistributorTokenAccount = getAssociatedTokenAddressSync(
            rewardMint,
            rewardDistributorId,
            true
          );
          const userRewardMintTokenAccount =
            await withFindOrInitAssociatedTokenAccount(
              tx,
              connection,
              rewardMint,
              wallet.publicKey,
              wallet.publicKey
            );
          if (!rewardEntry) {
            const ix = await rewardsCenterProgram(connection, wallet)
              .methods.initRewardEntry()
              .accounts({
                rewardEntry: findRewardEntryId(
                  rewardDistributorId,
                  stakeEntryId
                ),
                rewardDistributor: rewardDistributorId,
                stakeEntry: stakeEntryId,
                payer: wallet.publicKey,
              })
              .instruction();
            tx.add(ix);
          }
          const remainingAccountsForPayment =
            await withRemainingAccountsForPaymentInfo(
              connection,
              tx,
              wallet.publicKey,
              rewardDistributorData.parsed.claimRewardsPaymentInfo
            );
          const ix = await rewardsCenterProgram(connection, wallet)
            .methods.claimRewards()
            .accounts({
              rewardEntry: findRewardEntryId(rewardDistributorId, stakeEntryId),
              rewardDistributor: rewardDistributorId,
              stakeEntry: stakeEntryId,
              stakePool: stakePoolId,
              rewardMint: rewardMint,
              userRewardMintTokenAccount: userRewardMintTokenAccount,
              rewardDistributorTokenAccount: rewardDistributorTokenAccount,
              user: wallet.publicKey,
            })
            .remainingAccounts(remainingAccountsForPayment)
            .instruction();
          tx.add(ix);
        }
      }
    }
    txs.push(tx);
  }
  return txs;
};

/**
 * Claim reward receipt from a given receipt manager
 *
 * @param connection
 * @param wallet
 * @param stakePoolIdentifier
 * @param mintInfo
 * @param receiptManagerId
 * @returns
 */
export const claimRewardReceipt = async (
  connection: Connection,
  wallet: Wallet,
  stakePoolIdentifier: string,
  mintInfo: {
    mintId: PublicKey;
    fungible?: boolean;
  },
  receiptManagerId: PublicKey
) => {
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeEntryId = findStakeEntryId(
    stakePoolId,
    mintInfo.mintId,
    mintInfo.fungible ? wallet.publicKey : undefined
  );
  const rewardReceiptId = findRewardReceiptId(receiptManagerId, stakeEntryId);

  const accountDataById = await fetchIdlAccountDataById(connection, [
    receiptManagerId,
    rewardReceiptId,
  ]);
  const receiptManagerData = accountDataById[receiptManagerId.toString()];
  if (
    !receiptManagerData?.parsed ||
    receiptManagerData.type !== "receiptManager"
  ) {
    throw "Receipt manager not found";
  }

  const tx = new Transaction();
  const ix = await rewardsCenterProgram(connection, wallet)
    .methods.updateTotalStakeSeconds()
    .accounts({
      stakeEntry: stakeEntryId,
      updater: wallet.publicKey,
    })
    .instruction();
  tx.add(ix);
  if (!accountDataById[rewardReceiptId.toString()]?.parsed) {
    const ix = await rewardsCenterProgram(connection, wallet)
      .methods.initRewardReceipt()
      .accounts({
        rewardReceipt: rewardReceiptId,
        receiptManager: receiptManagerId,
        stakeEntry: stakeEntryId,
        payer: wallet.publicKey,
      })
      .instruction();
    tx.add(ix);
  }
  const remainingAccountsForPayment = await withRemainingAccountsForPayment(
    connection,
    tx,
    wallet.publicKey,
    receiptManagerData.parsed.paymentMint,
    (receiptManagerData.parsed.paymentShares as PaymentShare[]).map(
      (p) => p.address
    )
  );

  const remainingAccountsForAction = await withRemainingAccountsForPaymentInfo(
    connection,
    tx,
    wallet.publicKey,
    receiptManagerData.parsed.claimActionPaymentInfo
  );
  const rewardReceiptIx = await rewardsCenterProgram(connection, wallet)
    .methods.claimRewardReceipt()
    .accounts({
      rewardReceipt: rewardReceiptId,
      receiptManager: receiptManagerId,
      stakeEntry: stakeEntryId,
      payer: wallet.publicKey,
      claimer: wallet.publicKey,
    })
    .remainingAccounts([
      ...remainingAccountsForPayment,
      ...remainingAccountsForAction,
    ])
    .instruction();
  tx.add(rewardReceiptIx);
  return tx;
};

/**
 * Boost a given stake entry using the specified stake booster
 *
 * @param connection
 * @param wallet
 * @param stakePoolIdentifier
 * @param secondsToBoost
 * @param mintInfo
 * @param stakeBoosterIdentifer
 * @returns
 */
export const boost = async (
  connection: Connection,
  wallet: Wallet,
  stakePoolIdentifier: string,
  mintInfo: {
    mintId: PublicKey;
    fungible?: boolean;
  },
  secondsToBoost: number,
  stakeBoosterIdentifer?: number
) => {
  const stakePoolId = findStakePoolId(stakePoolIdentifier);
  const stakeEntryId = findStakeEntryId(
    stakePoolId,
    mintInfo.mintId,
    mintInfo.fungible ? wallet.publicKey : undefined
  );
  const stakeBoosterId = findStakeBoosterId(
    stakePoolId,
    stakeBoosterIdentifer ? new BN(stakeBoosterIdentifer) : undefined
  );

  const accountDataById = await fetchIdlAccountDataById(connection, [
    stakeBoosterId,
  ]);
  const stakeBoosterData = accountDataById[stakeBoosterId.toString()];
  if (!stakeBoosterData?.parsed || stakeBoosterData.type !== "stakeBooster") {
    throw "Stake booster not found";
  }

  const tx = new Transaction();
  const ix = await rewardsCenterProgram(connection, wallet)
    .methods.updateTotalStakeSeconds()
    .accounts({
      stakeEntry: stakeEntryId,
      updater: wallet.publicKey,
    })
    .instruction();
  tx.add(ix);

  const remainingAccountsForPayment = await withRemainingAccountsForPayment(
    connection,
    tx,
    wallet.publicKey,
    stakeBoosterData.parsed.paymentMint,
    (stakeBoosterData.parsed.paymentShares as PaymentShare[]).map(
      (p) => p.address
    )
  );

  const remainingAccountsForAction = await withRemainingAccountsForPaymentInfo(
    connection,
    tx,
    wallet.publicKey,
    stakeBoosterData.parsed.boostActionPaymentInfo
  );
  const boostIx = await rewardsCenterProgram(connection, wallet)
    .methods.boostStakeEntry({ secondsToBoost: new BN(secondsToBoost) })
    .accounts({
      stakePool: stakePoolId,
      stakeBooster: stakeBoosterId,
      stakeEntry: stakeEntryId,
      stakeMint: mintInfo.mintId,
    })
    .remainingAccounts([
      ...remainingAccountsForPayment,
      ...remainingAccountsForAction,
    ])
    .instruction();
  tx.add(boostIx);
  return tx;
};
