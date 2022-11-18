import { withFindOrInitAssociatedTokenAccount } from "@cardinal/common";
import type * as beet from "@metaplex-foundation/beet";
import * as tokenMetadata from "@metaplex-foundation/mpl-token-metadata";
import type { Wallet } from "@project-serum/anchor/dist/cjs/provider";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import type { Connection, PublicKey } from "@solana/web3.js";
import { Transaction } from "@solana/web3.js";
import { BN } from "bn.js";
import * as tokenMetadatV1 from "mpl-token-metadata-v1";

import { fetchAccountDataById } from "./accounts";
import {
  createBoostStakeEntryInstruction,
  createClaimRewardReceiptInstruction,
  createClaimRewardsInstruction,
  createInitEntryInstruction,
  createInitRewardEntryInstruction,
  createInitRewardReceiptInstruction,
  createStakeEditionInstruction,
  createUnstakeEditionInstruction,
  createUpdateTotalStakeSecondsInstruction,
} from "./generated";
import {
  withRemainingAccounts,
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
    amount?: beet.bignum;
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

  const accountDataById = await fetchAccountDataById(connection, [
    stakePoolId,
    ...mints.map((m) => m.stakeEntryId),
  ]);
  const stakePoolData = accountDataById[stakePoolId.toString()];
  if (!stakePoolData?.parsed || stakePoolData.type !== "stakePool") {
    throw "Stake pool not found";
  }

  const txs: Transaction[] = [];
  for (const { mintId, stakeEntryId, amount } of mints) {
    const tx = new Transaction();
    const metadataId = await tokenMetadatV1.Metadata.getPDA(mintId);
    if (!accountDataById[stakeEntryId.toString()]) {
      tx.add(
        createInitEntryInstruction(
          {
            stakeEntry: stakeEntryId,
            stakePool: stakePoolId,
            stakeMint: mintId,
            stakeMintMetadata: metadataId,
            payer: wallet.publicKey,
          },
          {
            user: wallet.publicKey,
          }
        )
      );
    }

    const userEscrowId = findUserEscrowId(wallet.publicKey);
    const userAtaId = getAssociatedTokenAddressSync(
      mintId,
      wallet.publicKey,
      true
    );
    const editionId = await tokenMetadatV1.Edition.getPDA(mintId);
    const stakeIx = createStakeEditionInstruction(
      {
        stakeEntry: stakeEntryId,
        stakePool: stakePoolId,
        stakeMint: mintId,
        stakeMintEdition: editionId,
        stakeMintMetadata: metadataId,
        user: wallet.publicKey,
        userEscrow: userEscrowId,
        userStakeMintTokenAccount: userAtaId,
        tokenMetadataProgram: tokenMetadata.PROGRAM_ID,
      },
      {
        amount: amount ?? 1,
      }
    );
    tx.add(
      withRemainingAccounts(
        stakeIx,
        await withRemainingAccountsForPaymentInfo(
          connection,
          tx,
          wallet.publicKey,
          stakePoolData.parsed.stakePaymentInfo
        )
      )
    );
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

  const accountDataById = await fetchAccountDataById(connection, [
    stakePoolId,
    ...(rewardDistributorIds ?? []),
    ...mints.map((m) => m.rewardEntryIds ?? []).flat(),
  ]);
  const stakePoolData = accountDataById[stakePoolId.toString()];

  const txs: Transaction[] = [];
  for (const { mintId, stakeEntryId, rewardEntryIds } of mints) {
    const tx = new Transaction();
    const userEscrowId = findUserEscrowId(wallet.publicKey);
    const userAtaId = getAssociatedTokenAddressSync(mintId, wallet.publicKey);
    const editionId = await tokenMetadatV1.Edition.getPDA(mintId);

    if (
      rewardEntryIds &&
      rewardDistributorIds &&
      rewardDistributorIds?.length > 0
    ) {
      tx.add(
        createUpdateTotalStakeSecondsInstruction({
          stakeEntry: stakeEntryId,
          updater: wallet.publicKey,
        })
      );
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
            rewardDistributorId
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
            tx.add(
              createInitRewardEntryInstruction({
                rewardEntry: findRewardEntryId(
                  rewardDistributorId,
                  stakeEntryId
                ),
                rewardDistributor: rewardDistributorId,
                stakeEntry: stakeEntryId,
                payer: wallet.publicKey,
              })
            );
          }
          const remainingAccountsForPayment =
            await withRemainingAccountsForPaymentInfo(
              connection,
              tx,
              wallet.publicKey,
              rewardDistributorData.parsed.claimRewardsPaymentInfo
            );
          tx.add(
            withRemainingAccounts(
              createClaimRewardsInstruction({
                rewardEntry: findRewardEntryId(
                  rewardDistributorId,
                  stakeEntryId
                ),
                rewardDistributor: rewardDistributorId,
                stakeEntry: stakeEntryId,
                stakePool: stakePoolId,
                rewardMint: rewardMint,
                userRewardMintTokenAccount: userRewardMintTokenAccount,
                rewardDistributorTokenAccount: rewardDistributorTokenAccount,
                user: wallet.publicKey,
              }),
              remainingAccountsForPayment
            )
          );
        }
      }
    }

    const unstakeIx = createUnstakeEditionInstruction({
      stakeEntry: stakeEntryId,
      stakePool: stakePoolId,
      stakeMint: mintId,
      stakeMintEdition: editionId,
      user: wallet.publicKey,
      userEscrow: userEscrowId,
      userStakeMintTokenAccount: userAtaId,
      tokenMetadataProgram: tokenMetadata.PROGRAM_ID,
    });
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
    tx.add(withRemainingAccounts(unstakeIx, remainingAccounts));
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

  const accountDataById = await fetchAccountDataById(connection, [
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
      tx.add(
        createUpdateTotalStakeSecondsInstruction({
          stakeEntry: stakeEntryId,
          updater: wallet.publicKey,
        })
      );
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
            rewardDistributorId
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
            tx.add(
              createInitRewardEntryInstruction({
                rewardEntry: findRewardEntryId(
                  rewardDistributorId,
                  stakeEntryId
                ),
                rewardDistributor: rewardDistributorId,
                stakeEntry: stakeEntryId,
                payer: wallet.publicKey,
              })
            );
          }
          const remainingAccountsForPayment =
            await withRemainingAccountsForPaymentInfo(
              connection,
              tx,
              wallet.publicKey,
              rewardDistributorData.parsed.claimRewardsPaymentInfo
            );
          tx.add(
            withRemainingAccounts(
              createClaimRewardsInstruction({
                rewardEntry: findRewardEntryId(
                  rewardDistributorId,
                  stakeEntryId
                ),
                rewardDistributor: rewardDistributorId,
                stakeEntry: stakeEntryId,
                stakePool: stakePoolId,
                rewardMint: rewardMint,
                userRewardMintTokenAccount: userRewardMintTokenAccount,
                rewardDistributorTokenAccount: rewardDistributorTokenAccount,
                user: wallet.publicKey,
              }),
              remainingAccountsForPayment
            )
          );
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

  const accountDataById = await fetchAccountDataById(connection, [
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
  tx.add(
    createUpdateTotalStakeSecondsInstruction({
      stakeEntry: stakeEntryId,
      updater: wallet.publicKey,
    })
  );
  if (!accountDataById[rewardReceiptId.toString()]?.parsed) {
    tx.add(
      createInitRewardReceiptInstruction({
        rewardReceipt: rewardReceiptId,
        receiptManager: receiptManagerId,
        stakeEntry: stakeEntryId,
        payer: wallet.publicKey,
      })
    );
  }
  const remainingAccountsForPayment = await withRemainingAccountsForPayment(
    connection,
    tx,
    wallet.publicKey,
    receiptManagerData.parsed.paymentMint,
    receiptManagerData.parsed.paymentShares.map((p) => p.address)
  );

  const remainingAccountsForAction = await withRemainingAccountsForPaymentInfo(
    connection,
    tx,
    wallet.publicKey,
    receiptManagerData.parsed.claimActionPaymentInfo
  );
  tx.add(
    withRemainingAccounts(
      createClaimRewardReceiptInstruction({
        rewardReceipt: rewardReceiptId,
        receiptManager: receiptManagerId,
        stakeEntry: stakeEntryId,
        payer: wallet.publicKey,
        claimer: wallet.publicKey,
      }),
      [...remainingAccountsForPayment, ...remainingAccountsForAction]
    )
  );
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

  const accountDataById = await fetchAccountDataById(connection, [
    stakeBoosterId,
  ]);
  const stakeBoosterData = accountDataById[stakeBoosterId.toString()];
  if (!stakeBoosterData?.parsed || stakeBoosterData.type !== "stakeBooster") {
    throw "Stake booster not found";
  }

  const tx = new Transaction();
  tx.add(
    createUpdateTotalStakeSecondsInstruction({
      stakeEntry: stakeEntryId,
      updater: wallet.publicKey,
    })
  );

  const remainingAccountsForPayment = await withRemainingAccountsForPayment(
    connection,
    tx,
    wallet.publicKey,
    stakeBoosterData.parsed.paymentMint,
    stakeBoosterData.parsed.paymentShares.map((p) => p.address)
  );

  const remainingAccountsForAction = await withRemainingAccountsForPaymentInfo(
    connection,
    tx,
    wallet.publicKey,
    stakeBoosterData.parsed.boostActionPaymentInfo
  );
  tx.add(
    withRemainingAccounts(
      createBoostStakeEntryInstruction(
        {
          stakePool: stakePoolId,
          stakeBooster: stakeBoosterId,
          stakeEntry: stakeEntryId,
          stakeMint: mintInfo.mintId,
        },
        {
          ix: {
            secondsToBoost,
          },
        }
      ),
      [...remainingAccountsForPayment, ...remainingAccountsForAction]
    )
  );
  return tx;
};
