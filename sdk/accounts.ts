import { getBatchedMultipleAccounts } from "@cardinal/common";
import type { Idl } from "@project-serum/anchor";
import { BorshAccountsCoder } from "@project-serum/anchor";
import type {
  AllAccountsMap,
  IdlTypes,
  TypeDef,
} from "@project-serum/anchor/dist/cjs/program/namespace/types";
import type {
  AccountInfo,
  Connection,
  GetAccountInfoConfig,
  PublicKey,
} from "@solana/web3.js";

import type {
  ReceiptManager,
  RewardDistributor,
  RewardEntry,
  RewardReceipt,
  StakeAuthorizationRecord,
  StakeBooster,
  StakeEntry,
  StakePool,
} from "./constants";
import { REWARDS_CENTER_ADDRESS, REWARDS_CENTER_IDL } from "./constants";
import type { CardinalRewardsCenter } from "./idl/cardinal_rewards_center";

export const fetchIdlAccount = async <
  T extends keyof AllAccountsMap<IDL>,
  IDL extends Idl = CardinalRewardsCenter
>(
  connection: Connection,
  pubkey: PublicKey,
  accountType: T,
  config?: GetAccountInfoConfig
) => {
  const account = await fetchIdlAccountNullable<T, IDL>(
    connection,
    pubkey,
    accountType,
    config
  );
  if (!account) throw "Account info not found";
  return account;
};

export const fetchIdlAccountNullable = async <
  T extends keyof AllAccountsMap<IDL>,
  IDL extends Idl = CardinalRewardsCenter
>(
  connection: Connection,
  pubkey: PublicKey,
  accountType: T,
  config?: GetAccountInfoConfig,
  idl: Idl = REWARDS_CENTER_IDL
) => {
  const accountInfo = await connection.getAccountInfo(pubkey, config);
  if (!accountInfo) return null;

  const parsed: TypeDef<
    AllAccountsMap<IDL>[T],
    IdlTypes<IDL>
  > = new BorshAccountsCoder(idl).decode(accountType, accountInfo.data);
  return {
    ...accountInfo,
    pubkey,
    parsed,
    type: accountType,
  };
};

export type AccountData = AccountInfo<Buffer> & { pubkey: PublicKey } & (
    | {
        type: "rewardDistributor";
        parsed: RewardDistributor["parsed"];
      }
    | { type: "rewardEntry"; parsed: RewardEntry["parsed"] }
    | { type: "stakePool"; parsed: StakePool["parsed"] }
    | { type: "stakeEntry"; parsed: StakeEntry["parsed"] }
    | { type: "receiptManager"; parsed: ReceiptManager["parsed"] }
    | { type: "rewardReceipt"; parsed: RewardReceipt["parsed"] }
    | { type: "stakeBooster"; parsed: StakeBooster["parsed"] }
    | {
        type: "stakeAuthorizationRecord";
        parsed: StakeAuthorizationRecord["parsed"];
      }
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
    const coder = new BorshAccountsCoder(REWARDS_CENTER_IDL);
    switch ([ownerString, discriminator].join(":")) {
      // stakePool
      case [
        REWARDS_CENTER_ADDRESS.toString(),
        BorshAccountsCoder.accountDiscriminator("stakePool"),
      ].join(":"):
        try {
          const type = "stakePool";
          const parsed: StakePool = coder.decode(type, accountInfo.data);
          acc[accountIds[i]!.toString()] = {
            ...baseData,
            ...accountInfo,
            type,
            parsed: parsed.parsed,
          };
        } catch (e) {
          //
        }
        return acc;
      // rewardDistributor
      case [
        REWARDS_CENTER_ADDRESS.toString(),
        BorshAccountsCoder.accountDiscriminator("rewardDistributor"),
      ].join(":"):
        try {
          const type = "rewardDistributor";
          const parsed: RewardDistributor = coder.decode(
            type,
            accountInfo.data
          );
          acc[accountIds[i]!.toString()] = {
            ...baseData,
            ...accountInfo,
            type,
            parsed: parsed.parsed,
          };
        } catch (e) {
          //
        }
        return acc;
      // stakeEntry
      case [
        REWARDS_CENTER_ADDRESS.toString(),
        BorshAccountsCoder.accountDiscriminator("stakeEntry"),
      ].join(":"):
        try {
          const type = "stakeEntry";
          const parsed: StakeEntry = coder.decode(type, accountInfo.data);
          acc[accountIds[i]!.toString()] = {
            ...baseData,
            ...accountInfo,
            type,
            parsed: parsed.parsed,
          };
        } catch (e) {
          //
        }
        return acc;
      // rewardEntry
      case [
        REWARDS_CENTER_ADDRESS.toString(),
        BorshAccountsCoder.accountDiscriminator("rewardEntry"),
      ].join(":"):
        try {
          const type = "rewardEntry";
          const parsed: RewardEntry = coder.decode(type, accountInfo.data);
          acc[accountIds[i]!.toString()] = {
            ...baseData,
            ...accountInfo,
            type,
            parsed: parsed.parsed,
          };
        } catch (e) {
          //
        }
        return acc;
      // receiptManager
      case [
        REWARDS_CENTER_ADDRESS.toString(),
        BorshAccountsCoder.accountDiscriminator("receiptManager"),
      ].join(":"):
        try {
          const type = "receiptManager";
          const parsed: ReceiptManager = coder.decode(type, accountInfo.data);
          acc[accountIds[i]!.toString()] = {
            ...baseData,
            ...accountInfo,
            type,
            parsed: parsed.parsed,
          };
        } catch (e) {
          //
        }
        return acc;
      // rewardReceipt
      case [
        REWARDS_CENTER_ADDRESS.toString(),
        BorshAccountsCoder.accountDiscriminator("rewardReceipt"),
      ].join(":"):
        try {
          const type = "rewardReceipt";
          const parsed: RewardReceipt = coder.decode(type, accountInfo.data);
          acc[accountIds[i]!.toString()] = {
            ...baseData,
            ...accountInfo,
            type,
            parsed: parsed.parsed,
          };
        } catch (e) {
          //
        }
        return acc;
      // stakeBooster
      case [
        REWARDS_CENTER_ADDRESS.toString(),
        BorshAccountsCoder.accountDiscriminator("stakeBooster"),
      ].join(":"):
        try {
          const type = "stakeBooster";
          const parsed: StakeBooster = coder.decode(type, accountInfo.data);
          acc[accountIds[i]!.toString()] = {
            ...baseData,
            ...accountInfo,
            type,
            parsed: parsed.parsed,
          };
        } catch (e) {
          //
        }
        return acc;
      // stakeAuthorizationRecord
      case [
        REWARDS_CENTER_ADDRESS.toString(),
        BorshAccountsCoder.accountDiscriminator("stakeAuthorizationRecord"),
      ].join(":"):
        try {
          const type = "stakeAuthorizationRecord";
          const parsed: StakeAuthorizationRecord = coder.decode(
            type,
            accountInfo.data
          );
          acc[accountIds[i]!.toString()] = {
            ...baseData,
            ...accountInfo,
            type,
            parsed: parsed.parsed,
          };
        } catch (e) {
          //
        }
        return acc;
      // fallback
      default:
        acc[accountIds[i]!.toString()] = {
          ...baseData,
          ...accountInfo,
          type: "unknown",
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
