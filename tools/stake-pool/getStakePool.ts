import type { Wallet } from "@project-serum/anchor";
import type { Connection } from "@solana/web3.js";

import { findStakePoolId } from "../../sdk";

export const commandName = "getStakePool";
export const description = "Get a stake pool";

export type Args = {
  identifier: string;
};

export const getArgs = (_connection: Connection, _wallet: Wallet) => ({
  identifier: "degods",
});

export const handler = async (
  connection: Connection,
  _wallet: Wallet,
  args: Args
) => {
  const stakePoolId = findStakePoolId(args.identifier);
  const stakePool = await connection.getAccountInfo(stakePoolId);
  console.log(
    `[success] ${args.identifier} [${stakePoolId.toString()}]`,
    JSON.stringify(stakePool, null, 2)
  );
};
