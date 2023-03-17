import { tryPublicKey } from "@cardinal/common";
import type { Wallet } from "@coral-xyz/anchor";
import type { Connection } from "@solana/web3.js";

import { decodeIdlAccount, findStakeEntryId } from "../../sdk";

export const commandName = "getStakeEntry";
export const description = "Get a stake entry for a mint in a pool";

export type Args = {
  poolId: string;
  mintId: string;
};

export const getArgs = (_connection: Connection, _wallet: Wallet) => ({
  poolId: "2BmUEV3rkBGpgcPXrZCRfKGsA3Nq17nh1AJB5nrH3STC",
  mintId: "9x8pDhjKMeyejWHhb9pcqbVbqAVasVGL4rDP1qkTUHTx",
});

export const handler = async (
  connection: Connection,
  _wallet: Wallet,
  args: Args
) => {
  const poolId = tryPublicKey(args.poolId);
  if (!poolId) throw "Invalid pool ID";
  const mintId = tryPublicKey(args.mintId);
  if (!mintId) throw "Invalid mint ID";
  const stakeEntryId = findStakeEntryId(poolId, mintId);
  const stakeEntry = await connection.getAccountInfo(stakeEntryId);
  if (!stakeEntry) throw "Stake pool not found";
  const parsed = decodeIdlAccount(stakeEntry, "stakeEntry");
  console.log(
    `[success] ${
      (args.poolId.toString(), args.mintId.toString())
    } [${stakeEntryId.toString()}]`,
    JSON.stringify(parsed, null, 2)
  );
};
