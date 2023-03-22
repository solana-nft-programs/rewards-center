import { chunkArray } from "@cardinal/common";
import type { Wallet } from "@project-serum/anchor/dist/cjs/provider";
import type { Connection } from "@solana/web3.js";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

import {
  fetchIdlAccountDataById,
  findStakeAuthorizationRecordId,
  rewardsCenterProgram,
} from "../../sdk";
import { executeTransactionBatches } from "../utils";

export const commandName = "authorizeMints";
export const description = "Authorize mints";

export const getArgs = (_connection: Connection, _wallet: Wallet) => ({
  // stake pool id
  stakePoolId: new PublicKey("3BZCupFU6X3wYJwgTsKS2vTs4VeMrhSZgx4P2TfzExtP"),
  // array of mints and multipliers to set
  entryDatas: [] as { mintId: PublicKey }[],
  // number of entries per transaction
  batchSize: 3,
  // number of transactions in parallel
  parallelBatchSize: 20,
  // whether to skip execution
  dryRun: false,
});

export const handler = async (
  connection: Connection,
  wallet: Wallet,
  args: ReturnType<typeof getArgs>
) => {
  const { stakePoolId, entryDatas } = args;
  const chunkData = entryDatas.map((e) => ({
    ...e,
    stakeAuthorizationRecordId: findStakeAuthorizationRecordId(
      stakePoolId,
      e.mintId
    ),
  }));

  console.log(`\n1/3 Fetching data...`);
  const stakeAuthorizationRecords = await fetchIdlAccountDataById(
    connection,
    chunkData.map((i) => i.stakeAuthorizationRecordId)
  );

  console.log(`\n2/3 Building transactions...`);
  const txs = [];
  const chunks = chunkArray(chunkData, args.batchSize);
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]!;
    const tx = new Transaction();
    console.log(`> ${i}/${chunks.length}`);
    for (let j = 0; j < chunk.length; j++) {
      const { mintId, stakeAuthorizationRecordId } = chunk[j]!;
      //   console.log(`>>[${j}/${chunk.length}] ${mintId.toString()}`);
      const stakeAuthorizationRecord =
        stakeAuthorizationRecords[stakeAuthorizationRecordId.toString()];
      if (!stakeAuthorizationRecord?.parsed) {
        const ix = await rewardsCenterProgram(connection, wallet)
          .methods.authorizeMint(mintId)
          .accountsStrict({
            stakePool: stakePoolId,
            stakeAuthorizationRecord: stakeAuthorizationRecordId,
            authority: wallet.publicKey,
            payer: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .instruction();
        tx.add(ix);
        console.log(
          `>>[${i + 1}/${chunks.length}][${j + 1}/${
            chunk.length
          }] 1. authorizeMint`
        );
      }
    }
    if (tx.instructions.length > 0) {
      txs.push(tx);
    }
  }

  console.log(
    `\n3/3 Executing ${txs.length} transactions batches=${args.parallelBatchSize}...`
  );
  if (!args.dryRun) {
    await executeTransactionBatches(connection, txs, wallet, {
      batchSize: args.parallelBatchSize,
      successHandler: (txid, { i, j, it, jt }) =>
        console.log(
          `>> ${i}/${it} ${j}/${jt} https://explorer.solana.com/tx/${txid}`
        ),
      errorHandler: (e, { i, j, it, jt }) =>
        console.log(`>> ${i}/${it} ${j}/${jt} error=`, e),
    });
  }
};
