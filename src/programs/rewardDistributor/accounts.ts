import type { AccountData } from "@cardinal/common";
import {
  AnchorProvider,
  BorshAccountsCoder,
  Program,
  utils,
} from "@project-serum/anchor";
import { SignerWallet } from "@saberhq/solana-contrib";
import type { Connection, PublicKey } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";

import type { REWARD_DISTRIBUTOR_PROGRAM } from ".";
import { REWARD_DISTRIBUTOR_ADDRESS, REWARD_DISTRIBUTOR_IDL } from ".";
import type { RewardDistributorData, RewardEntryData } from "./constants";

const getProgram = (connection: Connection) => {
  const provider = new AnchorProvider(
    connection,
    new SignerWallet(Keypair.generate()),
    {}
  );
  return new Program<REWARD_DISTRIBUTOR_PROGRAM>(
    REWARD_DISTRIBUTOR_IDL,
    REWARD_DISTRIBUTOR_ADDRESS,
    provider
  );
};

export const getRewardEntry = async (
  connection: Connection,
  rewardEntryId: PublicKey
): Promise<AccountData<RewardEntryData>> => {
  const rewardDistributorProgram = getProgram(connection);

  const parsed = (await rewardDistributorProgram.account.rewardEntry.fetch(
    rewardEntryId
  )) as RewardEntryData;
  return {
    parsed,
    pubkey: rewardEntryId,
  };
};

export const getRewardEntries = async (
  connection: Connection,
  rewardEntryIds: PublicKey[]
): Promise<AccountData<RewardEntryData>[]> => {
  const rewardDistributorProgram = getProgram(connection);

  const rewardEntries =
    (await rewardDistributorProgram.account.rewardEntry.fetchMultiple(
      rewardEntryIds
    )) as RewardEntryData[];
  return rewardEntries.map((entry, i) => ({
    parsed: entry,
    pubkey: rewardEntryIds[i]!,
  }));
};

export const getRewardDistributor = async (
  connection: Connection,
  rewardDistributorId: PublicKey
): Promise<AccountData<RewardDistributorData>> => {
  const rewardDistributorProgram = getProgram(connection);

  const parsed =
    (await rewardDistributorProgram.account.rewardDistributor.fetch(
      rewardDistributorId
    )) as RewardDistributorData;
  return {
    parsed,
    pubkey: rewardDistributorId,
  };
};

export const getRewardDistributors = async (
  connection: Connection,
  rewardDistributorIds: PublicKey[]
): Promise<AccountData<RewardDistributorData>[]> => {
  const rewardDistributorProgram = getProgram(connection);

  const rewardDistributors =
    (await rewardDistributorProgram.account.rewardDistributor.fetchMultiple(
      rewardDistributorIds
    )) as RewardDistributorData[];
  return rewardDistributors.map((distributor, i) => ({
    parsed: distributor,
    pubkey: rewardDistributorIds[i]!,
  }));
};

export const getRewardEntriesForRewardDistributor = async (
  connection: Connection,
  rewardDistributorId: PublicKey
): Promise<AccountData<RewardEntryData>[]> => {
  const programAccounts = await connection.getProgramAccounts(
    REWARD_DISTRIBUTOR_ADDRESS,
    {
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: utils.bytes.bs58.encode(
              BorshAccountsCoder.accountDiscriminator("rewardEntry")
            ),
          },
        },
        {
          memcmp: {
            offset: 41,
            bytes: rewardDistributorId.toBase58(),
          },
        },
      ],
    }
  );
  const rewardEntryDatas: AccountData<RewardEntryData>[] = [];
  const coder = new BorshAccountsCoder(REWARD_DISTRIBUTOR_IDL);
  programAccounts.forEach((account) => {
    try {
      const rewardEntryData: RewardEntryData = coder.decode(
        "rewardEntry",
        account.account.data
      );
      if (rewardEntryData) {
        rewardEntryDatas.push({
          ...account,
          parsed: rewardEntryData,
        });
      }
      // eslint-disable-next-line no-empty
    } catch (e) {}
  });
  return rewardEntryDatas.sort((a, b) =>
    a.pubkey.toBase58().localeCompare(b.pubkey.toBase58())
  );
};

export const getAllRewardEntries = async (
  connection: Connection
): Promise<AccountData<RewardEntryData>[]> => {
  const programAccounts = await connection.getProgramAccounts(
    REWARD_DISTRIBUTOR_ADDRESS,
    {
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: utils.bytes.bs58.encode(
              BorshAccountsCoder.accountDiscriminator("rewardEntry")
            ),
          },
        },
      ],
    }
  );
  const rewardEntryDatas: AccountData<RewardEntryData>[] = [];
  const coder = new BorshAccountsCoder(REWARD_DISTRIBUTOR_IDL);
  programAccounts.forEach((account) => {
    try {
      const rewardEntryData: RewardEntryData = coder.decode(
        "rewardEntry",
        account.account.data
      );
      if (rewardEntryData) {
        rewardEntryDatas.push({
          ...account,
          parsed: rewardEntryData,
        });
      }
      // eslint-disable-next-line no-empty
    } catch (e) {}
  });
  return rewardEntryDatas.sort((a, b) =>
    a.pubkey.toBase58().localeCompare(b.pubkey.toBase58())
  );
};
