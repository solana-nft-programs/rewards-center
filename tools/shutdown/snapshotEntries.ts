import { chunkArray, fetchAccountDataById } from "@cardinal/common";
import { type Wallet } from "@coral-xyz/anchor";
import type { Account } from "@solana/spl-token";
import {
  getAssociatedTokenAddressSync,
  unpackAccount,
} from "@solana/spl-token";
import type { Connection } from "@solana/web3.js";
import { existsSync, mkdirSync, writeFileSync } from "fs";

import type { RewardDistributor, StakePool } from "../../sdk";
import {
  fetchIdlAccountDataById,
  findRewardDistributorId,
  getProgramIdlAccounts,
} from "../../sdk";

export const commandName = "snapshotEntries";
export const description = "snapshot entries";
export const getArgs = (_connection: Connection, _wallet: Wallet) => ({
  batchSize: 1,
  parallelPools: 100,
});

export const handler = async (
  connection: Connection,
  _wallet: Wallet,
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
        await snapshotEntries(connection, stakePoolData, j, chunk.length);
      })
    );
  }
};

const snapshotEntries = async (
  connection: Connection,
  stakePoolData: {
    stakePool: StakePool;
    rewardDistributor: RewardDistributor | null;
    rewardDistributorTokenAccount: Account | null;
  },
  pid: number,
  pids: number
) => {
  const { stakePool, rewardDistributor, rewardDistributorTokenAccount } =
    stakePoolData;

  // fetch entries
  const stakeEntries = await getProgramIdlAccounts(connection, "stakeEntry", {
    filters: [
      {
        memcmp: {
          offset: 10,
          bytes: stakePool.pubkey.toString(),
        },
      },
    ],
  });
  const rewardEntries = rewardDistributor
    ? await getProgramIdlAccounts(connection, "rewardEntry", {
        filters: [
          {
            memcmp: {
              offset: 41,
              bytes: rewardDistributor.pubkey.toString(),
            },
          },
        ],
      })
    : [];
  console.log(` >> ${pid}/${pids}`);
  const dirBase = `tools/shutdown/data/mainnet-beta`;
  !existsSync(dirBase) && mkdirSync(dirBase);
  const dir = `${dirBase}/${stakePool.pubkey.toString()}`;
  !existsSync(dir) && mkdirSync(dir);
  writeFileSync(
    `${dir}/${new Date(Date.now()).toISOString()}.json`,
    JSON.stringify(
      {
        stakePool,
        rewardDistributor,
        rewardDistributorTokenAccount: rewardDistributorTokenAccount
          ? {
              ...rewardDistributorTokenAccount,
              amount: rewardDistributorTokenAccount.amount.toString(),
              delegatedAmount:
                rewardDistributorTokenAccount.delegatedAmount.toString(),
              rentExemptReserve:
                rewardDistributorTokenAccount.rentExemptReserve?.toString(),
            }
          : null,
        stakeEntries,
        rewardEntries,
      },
      (k, v) => {
        if (k === "data") return JSON.stringify(v);
        if (k === "parsed" && typeof v === "object")
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          return Object.entries(v).reduce((acc, [k, v]) => {
            acc[k] = v?.toString();
            return acc;
          }, {} as { [k: string]: string | undefined });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return v;
      },
      2
    )
  );
};
