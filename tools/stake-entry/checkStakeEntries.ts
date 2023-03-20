import type { Wallet } from "@coral-xyz/anchor";
import type { Connection } from "@solana/web3.js";

import { getProgramIdlAccounts } from "../../sdk";

export const commandName = "checkStakeEntries";
export const description = "Check and deserialize all stake entries";

// eslint-disable-next-line @typescript-eslint/ban-types
export type Args = {};

export const getArgs = (_connection: Connection, _wallet: Wallet) => ({});

export const handler = async (
  connection: Connection,
  _wallet: Wallet,
  _args: Args
) => {
  const programAccounts = await getProgramIdlAccounts(connection, "stakeEntry");
  const nulledAccounts = programAccounts.filter((acc) => !acc.parsed);
  console.log(
    `[success] [${nulledAccounts.length}]`,
    nulledAccounts.map((acc) => acc.pubkey.toString())
  );
};
