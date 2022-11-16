import type * as beet from "@metaplex-foundation/beet";
import * as tokenMetadata from "@metaplex-foundation/mpl-token-metadata";
import type { Wallet } from "@project-serum/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import type { Connection, PublicKey } from "@solana/web3.js";
import { Transaction } from "@solana/web3.js";
import * as tokenMetadatV1 from "mpl-token-metadata-v1";

import { fetchAccountDataById } from "./accounts";
import { REWARD_MANAGER_ID } from "./constants";
import {
  createClaimRewardsInstruction,
  createInitEntryInstruction,
  createInitRewardEntryInstruction,
  createStakeEditionInstruction,
  createUnstakeEditionInstruction,
  createUpdateTotalStakeSecondsInstruction,
} from "./generated";
import {
  findRewardEntryId,
  findStakeEntryId,
  findStakePoolId,
  findUserEscrowId,
} from "./pda";
import { withRemainingAccountsForPayment } from "./utils";

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

    const userEscrowId = findUserEscrowId(stakePoolId, wallet.publicKey);
    const userAtaId = getAssociatedTokenAddressSync(mintId, wallet.publicKey);
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

    const remainingAccounts = [];
    if (
      stakePoolData?.type === "stakePool" &&
      stakePoolData.parsed.paymentManager &&
      stakePoolData.parsed.paymentMint &&
      stakePoolData.parsed.paymentRecipient &&
      Number(stakePoolData.parsed.stakePaymentAmount) > 0
    ) {
      const remainingAccountsForPayment = await withRemainingAccountsForPayment(
        connection,
        tx,
        {
          paymentManager: stakePoolData.parsed.paymentManager,
          paymentMint: stakePoolData.parsed.paymentMint,
          payer: wallet.publicKey,
          target: stakePoolData.parsed.paymentRecipient,
        }
      );
      remainingAccounts.push(...remainingAccountsForPayment);
    }
    tx.add({
      ...stakeIx,
      keys: [...stakeIx.keys, ...remainingAccounts],
    });
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
    const userEscrowId = findUserEscrowId(stakePoolId, wallet.publicKey);
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
          const userRewardMintTokenAccount = getAssociatedTokenAddressSync(
            rewardMint,
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
          tx.add(
            createClaimRewardsInstruction({
              rewardEntry: findRewardEntryId(rewardDistributorId, stakeEntryId),
              rewardDistributor: rewardDistributorId,
              stakeEntry: stakeEntryId,
              stakePool: stakePoolId,
              rewardMint: rewardMint,
              userRewardMintTokenAccount: rewardDistributorId,
              rewardDistributorTokenAccount: rewardDistributorTokenAccount,
              authorityTokenAccount: userRewardMintTokenAccount,
              rewardManager: REWARD_MANAGER_ID,
              user: wallet.publicKey,
            })
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
      stakePoolData.parsed.paymentManager &&
      stakePoolData.parsed.paymentMint &&
      stakePoolData.parsed.paymentRecipient &&
      Number(stakePoolData.parsed.unstakePaymentAmount) > 0
    ) {
      const remainingAccountsForPayment = await withRemainingAccountsForPayment(
        connection,
        tx,
        {
          paymentManager: stakePoolData.parsed.paymentManager,
          paymentMint: stakePoolData.parsed.paymentMint,
          payer: wallet.publicKey,
          target: stakePoolData.parsed.paymentRecipient,
        }
      );
      remainingAccounts.push(...remainingAccountsForPayment);
    }
    tx.add({
      ...unstakeIx,
      keys: [...unstakeIx.keys, ...remainingAccounts],
    });
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
          const userRewardMintTokenAccount = getAssociatedTokenAddressSync(
            rewardMint,
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
          tx.add(
            createClaimRewardsInstruction({
              rewardEntry: findRewardEntryId(rewardDistributorId, stakeEntryId),
              rewardDistributor: rewardDistributorId,
              stakeEntry: stakeEntryId,
              stakePool: stakePoolId,
              rewardMint: rewardMint,
              userRewardMintTokenAccount: rewardDistributorId,
              rewardDistributorTokenAccount: rewardDistributorTokenAccount,
              authorityTokenAccount: userRewardMintTokenAccount,
              rewardManager: REWARD_MANAGER_ID,
              user: wallet.publicKey,
            })
          );
        }
      }
    }
    txs.push(tx);
  }
  return txs;
};
