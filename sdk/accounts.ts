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

import { REWARDS_CENTER_ADDRESS, REWARDS_CENTER_IDL } from "./constants";
import type { CardinalRewardsCenter } from "./idl/cardinal_rewards_center";

export type ParsedIdlAccount<IDL extends Idl = CardinalRewardsCenter> = {
  [T in keyof AllAccountsMap<IDL>]: {
    type: T;
    parsed: TypeDef<AllAccountsMap<IDL>[T], IdlTypes<IDL>>;
  };
};

export type IdlAccountInfo<
  T extends keyof AllAccountsMap<IDL>,
  IDL extends Idl = CardinalRewardsCenter
> = AccountInfo<Buffer> & ParsedIdlAccount<IDL>[T];

export type IdlAccountData<
  T extends keyof AllAccountsMap<IDL>,
  IDL extends Idl = CardinalRewardsCenter
> = {
  pubkey: PublicKey;
} & IdlAccountInfo<T, IDL>;

export type NullableIdlAccountInfo<
  T extends keyof AllAccountsMap<IDL>,
  IDL extends Idl = CardinalRewardsCenter
> =
  | IdlAccountInfo<T, IDL>
  | (AccountInfo<Buffer> & {
      type: "unknown";
      parsed: null;
    });

export type NullableIdlAccountData<
  T extends keyof AllAccountsMap<IDL>,
  IDL extends Idl = CardinalRewardsCenter
> = {
  pubkey: PublicKey;
} & NullableIdlAccountInfo<T, IDL>;

/**
 * Fetch an account with idl types
 * @param connection
 * @param pubkey
 * @param accountType
 * @param config
 * @returns
 */
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

/**
 * Fetch a possibly null account with idl types of a specific type
 * @param connection
 * @param pubkey
 * @param accountType
 * @param config
 * @param idl
 * @returns
 */
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
  if (
    !accountInfo ||
    accountInfo.owner.toString() !== REWARDS_CENTER_ADDRESS.toString()
  )
    return null;

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

/**
 * Decode an account with idl types of a specific type
 * @param accountInfo
 * @param accountType
 * @param idl
 * @returns
 */
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

/**
 * Try to decode an account with idl types of specific type
 * @param accountInfo
 * @param accountType
 * @param idl
 * @returns
 */
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

/**
 * Decode an idl account of unknown type
 * @param accountInfo
 * @param idl
 * @returns
 */
export const decodeIdlAccountUnknown = <
  T extends keyof AllAccountsMap<IDL>,
  IDL extends Idl = CardinalRewardsCenter
>(
  accountInfo: AccountInfo<Buffer> | null,
  idl: Idl = REWARDS_CENTER_IDL
): AccountInfo<Buffer> & ParsedIdlAccount<IDL>[T] => {
  if (!accountInfo) throw "No account found";
  // get idl accounts
  const idlAccounts = idl["accounts"];
  if (!idlAccounts) throw "No account definitions found in IDL";
  // find matching account name
  const accountTypes = idlAccounts.map((a) => a.name);
  const accountType = accountTypes?.find(
    (accountType) =>
      BorshAccountsCoder.accountDiscriminator(accountType).compare(
        accountInfo.data.subarray(0, 8)
      ) === 0
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

/**
 * Try to decode an account with idl types of unknown type
 * @param accountInfo
 * @param idl
 * @returns
 */
export const tryDecodeIdlAccountUnknown = <
  T extends keyof AllAccountsMap<IDL>,
  IDL extends Idl = CardinalRewardsCenter
>(
  accountInfo: AccountInfo<Buffer>,
  idl: Idl = REWARDS_CENTER_IDL
): NullableIdlAccountInfo<T, IDL> => {
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

/**
 * Get program accounts of a specific idl type
 * @param connection
 * @param accountType
 * @param config
 * @param programId
 * @param idl
 * @returns
 */
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

export type IdlAccountDataById<
  T extends keyof AllAccountsMap<IDL>,
  IDL extends Idl = CardinalRewardsCenter
> = {
  [accountId: string]: NullableIdlAccountData<T, IDL>;
};

/**
 * Decode account infos with corresponding ids
 * @param accountIds
 * @param accountInfos
 * @returns
 */
export const decodeAccountInfos = <
  T extends keyof AllAccountsMap<IDL>,
  IDL extends Idl = CardinalRewardsCenter
>(
  accountIds: PublicKey[],
  accountInfos: (AccountInfo<Buffer> | null)[]
): IdlAccountDataById<T, IDL> => {
  return accountInfos.reduce((acc, accountInfo, i) => {
    if (!accountInfo?.data) return acc;
    const accoutIdString = accountIds[i]?.toString() ?? "";
    const ownerString = accountInfo.owner.toString();
    const baseData = {
      timestamp: Date.now(),
      pubkey: accountIds[i]!,
    };
    switch (ownerString) {
      // stakePool
      case REWARDS_CENTER_ADDRESS.toString(): {
        acc[accoutIdString] = {
          ...baseData,
          ...tryDecodeIdlAccountUnknown<T, IDL>(accountInfo),
        };
        return acc;
      }
      // fallback
      default:
        acc[accoutIdString] = {
          ...baseData,
          ...accountInfo,
          type: "unknown",
          parsed: null,
        };
        return acc;
    }
  }, {} as IdlAccountDataById<T, IDL>);
};

/**
 * Batch fetch a map of accounts and their corresponding ids
 * @param connection
 * @param ids
 * @returns
 */
export const fetchIdlAccountDataById = async <
  T extends keyof AllAccountsMap<IDL>,
  IDL extends Idl = CardinalRewardsCenter
>(
  connection: Connection,
  ids: (PublicKey | null)[]
): Promise<IdlAccountDataById<T, IDL>> => {
  const filteredIds = ids.filter((id): id is PublicKey => id !== null);
  const accountInfos = await getBatchedMultipleAccounts(
    connection,
    filteredIds
  );
  return decodeAccountInfos(filteredIds, accountInfos);
};
