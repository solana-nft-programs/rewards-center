import { getBatchedMultipleAccounts } from "@cardinal/common";
import type { AccountInfo, Connection, PublicKey } from "@solana/web3.js";

import type { RewardEntry } from "./generated";
import {
  PROGRAM_ID,
  RewardDistributor,
  rewardDistributorDiscriminator,
  StakeEntry,
  stakeEntryDiscriminator,
  StakePool,
  stakePoolDiscriminator,
} from "./generated";

export type AccountData = AccountInfo<Buffer> &
  (
    | {
        type: "rewardDistributor";
        parsed: RewardDistributor;
      }
    | { type: "rewardEntry"; parsed: RewardEntry }
    | { type: "stakePool"; parsed: StakePool }
    | { type: "stakeEntry"; parsed: StakeEntry }
    | { type: "unknown"; parsed: null }
  );

export type AccountDataById = {
  [accountId: string]: AccountData;
};

export const deserializeAccountInfos = (
  accountIds: (PublicKey | null)[],
  accountInfos: (AccountInfo<Buffer> | null)[]
): AccountDataById => {
  return accountInfos.reduce((acc, accountInfo, i) => {
    if (!accountInfo?.data) return acc;
    const ownerString = accountInfo.owner.toString();
    const baseData = {
      timestamp: Date.now(),
      pubkey: accountIds[i]!,
    };
    const discriminator = accountInfo.data
      .subarray(0, 8)
      .map((b) => b.valueOf())
      .join(",");
    switch ([ownerString, discriminator].join(":")) {
      // stakePool
      case [PROGRAM_ID.toString(), stakePoolDiscriminator.join(",")].join(":"):
        try {
          const parsed = StakePool.deserialize(accountInfo.data)[0];
          const type = "stakePool";
          acc[accountIds[i]!.toString()] = {
            ...baseData,
            type,
            ...accountInfo,
            parsed,
          };
        } catch (e) {
          //
        }
        return acc;
      // rewardDistributor
      case [
        PROGRAM_ID.toString(),
        rewardDistributorDiscriminator.join(","),
      ].join(":"):
        try {
          const parsed = RewardDistributor.deserialize(accountInfo.data)[0];
          const type = "rewardDistributor";
          acc[accountIds[i]!.toString()] = {
            ...baseData,
            type,
            ...accountInfo,
            parsed,
          };
        } catch (e) {
          //
        }
        return acc;
      // stakeEntry
      case [PROGRAM_ID.toString(), stakeEntryDiscriminator.join(",")].join(":"):
        try {
          const parsed = StakeEntry.deserialize(accountInfo.data)[0];
          const type = "stakeEntry";
          acc[accountIds[i]!.toString()] = {
            ...baseData,
            type,
            ...accountInfo,
            parsed,
          };
        } catch (e) {
          //
        }
        return acc;
      // fallback
      default:
        acc[accountIds[i]!.toString()] = {
          ...baseData,
          type: "unknown",
          ...accountInfo,
          parsed: null,
        };
        return acc;
    }
  }, {} as AccountDataById);
};

export const fetchAccountDataById = async (
  connection: Connection,
  ids: (PublicKey | null)[]
): Promise<AccountDataById> => {
  const filteredIds = ids.filter((id): id is PublicKey => id !== null);
  const accountInfos = await getBatchedMultipleAccounts(
    connection,
    filteredIds
  );
  return deserializeAccountInfos(filteredIds, accountInfos);
};
