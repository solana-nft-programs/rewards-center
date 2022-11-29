import { getBatchedMultipleAccounts } from "@cardinal/common";
import type { Idl } from "@project-serum/anchor";
import { BorshAccountsCoder, utils } from "@project-serum/anchor";
import type {
  AllAccountsMap,
  IdlTypes,
  TypeDef,
} from "@project-serum/anchor/dist/cjs/program/namespace/types";
import type {
  AccountInfo,
  Connection,
  GetAccountInfoConfig,
  GetProgramAccountsConfig,
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

export type IdlAccountInfo<IDL extends Idl = CardinalRewardsCenter> = {
  [T in keyof AllAccountsMap<IDL>]: AccountInfo<Buffer> & {
    type: T;
    parsed: TypeDef<AllAccountsMap<IDL>[T], IdlTypes<IDL>>;
  };
};

export type IdlAccount<IDL extends Idl = CardinalRewardsCenter> = {
  [T in keyof AllAccountsMap<IDL>]: {
    pubkey: PublicKey;
  } & IdlAccountInfo<IDL>[T];
};

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

export const decodeIdlAccount = <
  T extends keyof AllAccountsMap<IDL>,
  IDL extends Idl = CardinalRewardsCenter
>(
  accountInfo: AccountInfo<Buffer>,
  accountType: T,
  idl: Idl = REWARDS_CENTER_IDL
) => {
  const parsed: TypeDef<
    AllAccountsMap<IDL>[T],
    IdlTypes<IDL>
  > = new BorshAccountsCoder(idl).decode(accountType, accountInfo.data);
  return {
    ...accountInfo,
    type: accountType,
    parsed,
  };
};

export const tryDecodeIdlAccount = <
  T extends keyof AllAccountsMap<IDL>,
  IDL extends Idl = CardinalRewardsCenter
>(
  accountInfo: AccountInfo<Buffer>,
  accountType: T,
  idl: Idl = REWARDS_CENTER_IDL
) => {
  try {
    return decodeIdlAccount<T, IDL>(accountInfo, accountType, idl);
  } catch (e) {
    return {
      ...accountInfo,
      type: "unknown",
      parsed: null,
    };
  }
};

export const decodeIdlAccountUnknown = <
  T extends keyof AllAccountsMap<IDL>,
  IDL extends Idl = CardinalRewardsCenter
>(
  accountInfo: AccountInfo<Buffer> | null,
  idl: Idl = REWARDS_CENTER_IDL
): IdlAccountInfo<IDL>[T] => {
  if (!accountInfo) throw "No account found";
  // get idl accounts
  const idlAccounts = idl["accounts"];
  if (!idlAccounts) throw "No account definitions found in IDL";
  // find matching account name
  const accountTypes = idlAccounts.map((a) => a.name);
  const accountType = accountTypes?.find((accountType) =>
    BorshAccountsCoder.accountDiscriminator(accountType).compare(
      accountInfo.data.subarray(0, 8)
    )
  );
  if (!accountType) throw "No account discriminator match found";

  // decode
  const parsed: TypeDef<
    AllAccountsMap<IDL>[T],
    IdlTypes<IDL>
  > = new BorshAccountsCoder(idl).decode(accountType, accountInfo.data);
  return {
    ...accountInfo,
    type: accountType as T,
    parsed,
  };
};

export const tryDecodeIdlAccountUnknown = <
  T extends keyof AllAccountsMap<IDL>,
  IDL extends Idl = CardinalRewardsCenter
>(
  accountInfo: AccountInfo<Buffer>,
  idl: Idl = REWARDS_CENTER_IDL
) => {
  if (!accountInfo) return null;
  try {
    return decodeIdlAccountUnknown<T, IDL>(accountInfo, idl);
  } catch (e) {
    return {
      ...accountInfo,
      type: "unknown",
      parsed: null,
    };
  }
};

export const getProgramIdlAccounts = async <
  T extends keyof AllAccountsMap<IDL>,
  IDL extends Idl = CardinalRewardsCenter
>(
  connection: Connection,
  accountType: T,
  config?: GetProgramAccountsConfig,
  programId: PublicKey = REWARDS_CENTER_ADDRESS,
  idl: Idl = REWARDS_CENTER_IDL
) => {
  const accountInfos = await connection.getProgramAccounts(programId, {
    filters: [
      {
        memcmp: {
          offset: 0,
          bytes: utils.bytes.bs58.encode(
            BorshAccountsCoder.accountDiscriminator(accountType)
          ),
        },
      },
      ...(config?.filters ?? []),
    ],
  });
  return accountInfos.map((accountInfo) => ({
    pubkey: accountInfo.pubkey,
    ...tryDecodeIdlAccount<T, IDL>(accountInfo.account, accountType, idl),
  }));
};

export type AccountData = AccountInfo<Buffer> & { pubkey: PublicKey } & (
    | {
        type: "rewardDistributor";
        parsed: RewardDistributor;
      }
    | { type: "rewardEntry"; parsed: RewardEntry }
    | { type: "stakePool"; parsed: StakePool }
    | { type: "stakeEntry"; parsed: StakeEntry }
    | { type: "receiptManager"; parsed: ReceiptManager }
    | { type: "rewardReceipt"; parsed: RewardReceipt }
    | { type: "stakeBooster"; parsed: StakeBooster }
    | { type: "stakeAuthorizationRecord"; parsed: StakeAuthorizationRecord }
    | { type: "unknown"; parsed: null }
  );

export type AccountDataById = {
  [accountId: string]: ReturnType<>;
};

export const deserializeAccountInfos = (
  accountIds: PublicKey[],
  accountInfos: (AccountInfo<Buffer> | null)[]
): AccountDataById => {
  return accountInfos.reduce((acc, accountInfo, i) => {
    if (!accountInfo?.data) return acc;

    const ownerString = accountInfo.owner.toString();
    const baseData = {
      timestamp: Date.now(),
      pubkey: accountIds[i]!,
    };
    switch (ownerString) {
      // stakePool
      case REWARDS_CENTER_ADDRESS.toString():
        const account = tryDecodeIdlAccountUnknown(accountInfo);
        acc[accountIds[i]!.toString()] = {
          ...baseData,
          ...account,
        };
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
