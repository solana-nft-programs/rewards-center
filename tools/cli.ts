import { connectionFor } from "@cardinal/common";
import { Wallet } from "@coral-xyz/anchor";
import type { Cluster, Connection } from "@solana/web3.js";
import * as dotenv from "dotenv";
import * as readline from "readline";
import type { ArgumentsCamelCase, CommandModule } from "yargs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import * as createPaymentInfo from "./payment/createPaymentInfo";
import * as updatePaymentInfo from "./payment/updatePaymentInfo";
import * as getStakePool from "./stake-pool/getStakePool";
import { keypairFrom } from "./utils";

dotenv.config();

export type ProviderParams = {
  cluster: string;
  wallet: string;
};

const commandBuilder = <T>(command: {
  commandName: string;
  description: string;
  getArgs: (c: Connection, w: Wallet) => T;
  handler: (c: Connection, w: Wallet, a: T) => Promise<void>;
}): CommandModule<ProviderParams, ProviderParams> => {
  return {
    command: command.commandName,
    describe: command.description,
    handler: async ({
      cluster,
      wallet,
    }: ArgumentsCamelCase<ProviderParams>) => {
      const clusterString = process.env.CLUSTER || cluster;
      const c = connectionFor(clusterString as Cluster);
      const w = new Wallet(keypairFrom(process.env.WALLET || wallet, "wallet"));
      const a = command.getArgs(c, w);
      console.log(command.description);
      console.log(
        `[cluster=${clusterString}] [wallet=${w.publicKey.toString()}]`
      );
      console.log(`\n(modify args in ${command.commandName}.ts)`);
      console.log(JSON.stringify(a, null, 2));
      await question("\nExecute... [enter]");
      await command.handler(c, w, a);
    },
  };
};

export const question = async (query: string) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
};

void yargs(hideBin(process.argv))
  .positional("wallet", {
    describe: "Wallet to use - default to WALLET environment variable",
    default: "process.env.WALLET",
  })
  .positional("cluster", {
    describe:
      "Solana cluster moniker to use [mainnet, devnet] - ovverride url with RPC_URL environment variable or mainnet moniker with MAINNET_PRIMARY environment variable",
    default: "devnet",
  })
  .command(commandBuilder(createPaymentInfo))
  .command(commandBuilder(updatePaymentInfo))
  .command(commandBuilder(getStakePool))
  .strict()
  .demandCommand()
  .help("h")
  .alias({ h: "help" }).argv;
