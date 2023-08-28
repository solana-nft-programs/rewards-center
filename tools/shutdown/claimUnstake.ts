import {
  chunkArray,
  fetchAccountDataById,
  findMintEditionId,
  findMintMetadataId,
  findTokenRecordId,
  METADATA_PROGRAM_ID,
  TOKEN_AUTH_RULES_ID,
} from "@cardinal/common";
import {
  findMintManagerId,
  PROGRAM_ID as CREATOR_STANDARD_PROGRAM_ID,
} from "@cardinal/creator-standard";
import { type Wallet } from "@coral-xyz/anchor";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import type { Account } from "@solana/spl-token";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  unpackAccount,
} from "@solana/spl-token";
import {
  type Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import { BN } from "bn.js";

import type {
  RewardDistributor,
  RewardEntry,
  StakeEntry,
  StakePool,
} from "../../sdk";
import {
  fetchIdlAccountDataById,
  findRewardDistributorId,
  findRewardEntryId,
  findUserEscrowId,
  getProgramIdlAccounts,
  rewardsCenterProgram,
} from "../../sdk";
import { executeTransactionBatches } from "../utils";

export const commandName = "claimUnstake";
export const description = "Claim rewards and unstake";
export const getArgs = (_connection: Connection, _wallet: Wallet) => ({
  parallelTransactions: 20,
  parallelPools: 20,
});

export const handler = async (
  connection: Connection,
  wallet: Wallet,
  args: ReturnType<typeof getArgs>
) => {
  // get stake pools
  const stakePools = (
    await getProgramIdlAccounts(connection, "stakePool")
  ).filter((a): a is StakePool => a.type === "stakePool");

  // get reward distributors
  const rewardDistributorIds = stakePools.map((a) =>
    findRewardDistributorId(a.pubkey)
  );
  const rewardDistributorsById =
    await fetchIdlAccountDataById<"rewardDistributor">(
      connection,
      rewardDistributorIds
    );
  const rewardDistributorTokenAccountIds = Object.values(
    rewardDistributorsById
  ).map((rw) =>
    rw.parsed
      ? getAssociatedTokenAddressSync(rw.parsed.rewardMint, rw.pubkey, true)
      : null
  );
  const rewardDistributorTokenAccountInfosById = await fetchAccountDataById(
    connection,
    rewardDistributorTokenAccountIds
  );
  // build pool data
  const stakePoolDatas = stakePools.map((stakePool) => {
    const rewardDistributorId = findRewardDistributorId(stakePool.pubkey);
    const rewardDistributor =
      rewardDistributorsById[rewardDistributorId.toString()];
    const rewardDistributorTokenAccountId =
      rewardDistributor?.type === "rewardDistributor"
        ? getAssociatedTokenAddressSync(
            rewardDistributor.parsed.rewardMint,
            rewardDistributor.pubkey,
            true
          )
        : null;
    const rewardDistributorTokenAccount = rewardDistributorTokenAccountId
      ? rewardDistributorTokenAccountInfosById[
          rewardDistributorTokenAccountId?.toString()
        ]
      : null;
    if (stakePool.type !== "stakePool") throw "Invalid stake pool";
    if (!!rewardDistributor && rewardDistributor.type !== "rewardDistributor")
      throw "Invalid reward distributor";
    return {
      stakePool,
      rewardDistributor: rewardDistributor ?? null,
      rewardDistributorTokenAccount:
        rewardDistributorTokenAccountId && rewardDistributorTokenAccount
          ? unpackAccount(
              rewardDistributorTokenAccountId,
              rewardDistributorTokenAccount
            )
          : null,
    };
  });

  const chunks = chunkArray(stakePoolDatas, args.parallelPools);
  for (let i = 0; i < chunks.length; i++) {
    console.log(` > ${i + 1}/${chunks.length} ${chunks[i]!.length}`);
    const chunk = chunks[i]!;
    await Promise.all(
      chunk.map(async (stakePoolData, j) => {
        console.log(
          ` >> ${j + 1}/${
            chunk.length
          } ${stakePoolData.stakePool.pubkey.toString()}`
        );
        await claimUnstakePool(
          connection,
          wallet,
          stakePoolData,
          args.parallelTransactions,
          `${i}/${chunks.length} ${j}/${chunk.length}`
        );
      })
    );
  }
};

const claimUnstakePool = async (
  connection: Connection,
  wallet: Wallet,
  stakePoolData: {
    stakePool: StakePool;
    rewardDistributor: RewardDistributor | null;
    rewardDistributorTokenAccount: Account | null;
  },
  parallelTransactions: number,
  logPrefix: string
) => {
  const { stakePool, rewardDistributor } = stakePoolData;
  // fetch entries
  const stakeEntries = (
    await getProgramIdlAccounts<"stakeEntry">(connection, "stakeEntry", {
      filters: [
        {
          memcmp: {
            offset: 10,
            bytes: stakePool.pubkey.toString(),
          },
        },
      ],
    })
  ).filter((a): a is StakeEntry => a.type === "stakeEntry");
  const rewardEntries = rewardDistributor
    ? (
        await getProgramIdlAccounts(connection, "rewardEntry", {
          filters: [
            {
              memcmp: {
                offset: 41,
                bytes: rewardDistributor.pubkey.toString(),
              },
            },
          ],
        })
      ).filter((a): a is RewardEntry => a.type === "rewardEntry")
    : [];

  // collect entries
  const rewardEntriesByStakeEntryId = rewardEntries.reduce((acc, e) => {
    acc[e.parsed.stakeEntry.toString()] = e;
    return acc;
  }, {} as { [v: string]: RewardEntry });

  // join entries
  const entries = stakeEntries
    .map((stakeEntry) => {
      return {
        stakeEntry,
        rewardEntry: rewardEntriesByStakeEntryId[stakeEntry.pubkey.toString()],
      };
    })
    .sort(
      (a, b) =>
        (a.stakeEntry?.parsed.lastStakedAt.toNumber() ?? 0) -
        (b.stakeEntry?.parsed.lastStakedAt.toNumber() ?? 0)
    )
    .filter(
      ({ stakeEntry }) =>
        !!stakeEntry &&
        stakeEntry.parsed.lastStaker.toString() !==
          PublicKey.default.toString() &&
        Date.now() / 1000 -
          (
            stakeEntry?.parsed.lastUpdatedAt ||
            stakeEntry?.parsed.lastStakedAt ||
            new BN(0)
          ).toNumber() >
          10800
    );

  // fetch additional data
  const accountDataById = await fetchAccountDataById(connection, [
    ...stakeEntries.map((entry) => findMintManagerId(entry.parsed.stakeMint)),
  ]);

  const txs: Transaction[] = [];
  for (let i = 0; i < entries.length; i++) {
    const { stakeEntry, rewardEntry } = entries[i]!;
    const tx = new Transaction();

    // gather ids
    const userId = stakeEntry.parsed.lastStaker;
    const stakePoolId = stakePool.pubkey;
    const stakeEntryId = stakeEntry.pubkey;
    const mintId = stakeEntry.parsed.stakeMint;
    const userEscrowId = findUserEscrowId(userId);
    const userAtaId = getAssociatedTokenAddressSync(mintId, userId);

    // claim rewards
    if (rewardDistributor) {
      const rewardDistributorId = rewardDistributor.pubkey;
      if (!stakeEntry.parsed.cooldownStartSeconds) {
        tx.add(
          await rewardsCenterProgram(connection, wallet)
            .methods.updateTotalStakeSeconds()
            .accounts({
              stakeEntry: stakeEntry.pubkey,
              updater: wallet.publicKey,
            })
            .instruction()
        );
      }

      const rewardMint = rewardDistributor.parsed.rewardMint;
      const userRewardMintTokenAccount = getAssociatedTokenAddressSync(
        rewardMint,
        userId,
        true
      );
      tx.add(
        createAssociatedTokenAccountIdempotentInstruction(
          wallet.publicKey,
          userRewardMintTokenAccount,
          userId,
          rewardMint
        )
      );
      tx.add(
        createAssociatedTokenAccountIdempotentInstruction(
          wallet.publicKey,
          getAssociatedTokenAddressSync(
            rewardMint,
            rewardDistributor.pubkey,
            true
          ),
          rewardDistributor.pubkey,
          rewardMint
        )
      );
      if (!rewardEntry) {
        tx.add(
          await rewardsCenterProgram(connection, wallet)
            .methods.initRewardEntry()
            .accounts({
              rewardEntry: findRewardEntryId(rewardDistributorId, stakeEntryId),
              rewardDistributor: rewardDistributorId,
              stakeEntry: stakeEntryId,
              payer: wallet.publicKey,
            })
            .instruction()
        );
      }

      tx.add(
        await rewardsCenterProgram(connection, wallet)
          .methods.claimRewards()
          .accounts({
            rewardEntry: findRewardEntryId(rewardDistributorId, stakeEntryId),
            rewardDistributor: rewardDistributorId,
            stakeEntry: stakeEntryId,
            stakePool: stakePoolId,
            rewardMint: rewardMint,
            userRewardMintTokenAccount: getAssociatedTokenAddressSync(
              rewardMint,
              userId,
              true
            ),
            rewardDistributorTokenAccount: getAssociatedTokenAddressSync(
              rewardMint,
              rewardDistributorId,
              true
            ),
            user: wallet.publicKey,
          })
          .instruction()
      );
    }

    // unstake
    const metadataId = findMintMetadataId(mintId);
    const metadataAccountInfo = accountDataById[metadataId.toString()];
    const metadata = metadataAccountInfo
      ? Metadata.fromAccountInfo(metadataAccountInfo)[0]
      : null;
    tx.add(
      await rewardsCenterProgram(connection, wallet)
        .methods.forceUnstake()
        .accountsStrict({
          stakePool: stakePoolId,
          stakeEntry: stakeEntryId,
          stakeMint: mintId,
          stakeMintMetadata: metadataId,
          stakeMintEdition: findMintEditionId(mintId),
          stakeMintUserTokenRecord: findTokenRecordId(mintId, userAtaId),
          stakeMintManager: findMintManagerId(mintId),
          stakeMintUserTokenAccount: userAtaId,
          authorizationRules:
            metadata?.programmableConfig?.ruleSet ?? METADATA_PROGRAM_ID,
          user: userId,
          authority: wallet.publicKey,
          userEscrow: userEscrowId,
          tokenMetadataProgram: METADATA_PROGRAM_ID,
          creatorStandardProgram: CREATOR_STANDARD_PROGRAM_ID,
          sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          authorizationRulesProgram: TOKEN_AUTH_RULES_ID,
        })
        .instruction()
    );
    txs.push(tx);
  }

  await executeTransactionBatches(connection, txs, wallet, {
    batchSize: parallelTransactions,
    successHandler: (txid, { i, j, it, jt }) =>
      console.log(
        ` >>> ${logPrefix} ${i}/${it} ${j}/${jt} https://explorer.solana.com/tx/${txid}`
      ),
    errorHandler: (e, { i, j, it, jt }) =>
      console.log(` >>> ${logPrefix} ${i}/${it} ${j}/${jt} error=`, e),
  });
};
