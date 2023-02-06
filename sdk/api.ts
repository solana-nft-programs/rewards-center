import {
  findMintEditionId,
  findMintMetadataId,
  findTokenRecordId,
  METADATA_PROGRAM_ID,
  TOKEN_AUTH_RULES_ID,
  tryNull,
  withFindOrInitAssociatedTokenAccount,
} from "@cardinal/common";
import type * as beet from "@metaplex-foundation/beet";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import type { Wallet } from "@project-serum/anchor/dist/cjs/provider";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type { Connection, PublicKey } from "@solana/web3.js";
import {
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import BN from "bn.js";

import { fetchAccountDataById } from "./accounts";
import { rewardsCenterProgram } from "./constants";
import {
  createBoostStakeEntryInstruction,
  createClaimRewardReceiptInstruction,
  createClaimRewardsInstruction,
  createInitRewardEntryInstruction,
  createInitRewardReceiptInstruction,
  createUpdateTotalStakeSecondsInstruction,
} from "./generated";
import { fetchIdlAccountDataById } from "./idlAccounts";
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
  const accountDataById = await fetchIdlAccountDataById(connection, [
    stakePoolId,
    ...mints.map((m) => m.stakeEntryId),
    ...mints.map((m) => findMintMetadataId(m.mintId)),
  ]);
  const stakePoolData = accountDataById[stakePoolId.toString()];
  if (!stakePoolData?.parsed || stakePoolData.type !== "stakePool") {
    throw "Stake pool not found";
  }

  const txs: Transaction[] = [];
  for (const { mintId, stakeEntryId, amount } of mints) {
    const tx = new Transaction();
    const metadataId = findMintMetadataId(mintId);

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

    const metadataAccountInfo = accountDataById[metadataId.toString()];
    const metadataInfo = metadataAccountInfo
      ? Metadata.fromAccountInfo(metadataAccountInfo)[0]
      : undefined;
    if (metadataInfo && metadataInfo.programmableConfig?.ruleSet) {
      const editionId = findMintEditionId(mintId);
      const stakeTokenRecordAccountId = findTokenRecordId(mintId, userAtaId);
      const stakeIx = await rewardsCenterProgram(connection, wallet)
        .methods.stakePnft()
        .accountsStrict({
          stakePool: stakePoolId,
          stakeEntry: stakeEntryId,
          stakeMint: mintId,
          stakeMintMetadata: metadataId,
          stakeMintEdition: editionId,
          stakeTokenRecordAccount: stakeTokenRecordAccountId,
          authorizationRules: metadataInfo?.programmableConfig?.ruleSet,
          user: wallet.publicKey,
          userEscrow: userEscrowId,
          userStakeMintTokenAccount: userAtaId,
          tokenMetadataProgram: METADATA_PROGRAM_ID,
          sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          authorizationRulesProgram: TOKEN_AUTH_RULES_ID,
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
    ...mints.map((m) => m.stakeEntryId),
  ]);
  const stakePoolData = accountDataById[stakePoolId.toString()];

  const txs: Transaction[] = [];
  for (const { mintId, stakeEntryId, rewardEntryIds } of mints) {
    const tx = new Transaction();
    const userEscrowId = findUserEscrowId(wallet.publicKey);
    const userAtaId = getAssociatedTokenAddressSync(mintId, wallet.publicKey);
    const stakeEntry = accountDataById[stakeEntryId.toString()];

    if (
      rewardEntryIds &&
      rewardDistributorIds &&
      rewardDistributorIds?.length > 0 &&
      !(
        stakeEntry?.type === "stakeEntry" &&
        stakeEntry.parsed.cooldownStartSeconds
      )
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
          const userRewardMintTokenAccount = getAssociatedTokenAddressSync(
            rewardMint,
            wallet.publicKey,
            true
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

    const metadataId = findMintMetadataId(mintId);
    const metadata = await tryNull(
      Metadata.fromAccountAddress(connection, metadataId)
    );
    if (metadata?.programmableConfig?.ruleSet) {
      const editionId = findMintEditionId(mintId);
      const stakeTokenRecordAccountId = findTokenRecordId(mintId, userAtaId);
      const stakeIx = await rewardsCenterProgram(connection, wallet)
        .methods.unstakePnft()
        .accountsStrict({
          stakePool: stakePoolId,
          stakeEntry: stakeEntryId,
          stakeMint: mintId,
          stakeMintMetadata: metadataId,
          stakeMintEdition: editionId,
          stakeTokenRecordAccount: stakeTokenRecordAccountId,
          authorizationRules: metadata?.programmableConfig?.ruleSet,
          user: wallet.publicKey,
          userEscrow: userEscrowId,
          userStakeMintTokenAccount: userAtaId,
          tokenMetadataProgram: METADATA_PROGRAM_ID,
          sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          authorizationRulesProgram: TOKEN_AUTH_RULES_ID,
        })
        .remainingAccounts(remainingAccounts)
        .instruction();
      tx.add(stakeIx);
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
