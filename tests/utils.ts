import {
  createCreateMasterEditionV3Instruction,
  createCreateMetadataAccountV2Instruction,
} from "@metaplex-foundation/mpl-token-metadata";
import { utils, Wallet } from "@project-serum/anchor";
import {
  createAssociatedTokenAccountInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type { PublicKey, SendTransactionError, Signer } from "@solana/web3.js";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  sendAndConfirmRawTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import * as tokenMetadatV1 from "mpl-token-metadata-v1";

export async function newAccountWithLamports(
  connection: Connection,
  lamports = LAMPORTS_PER_SOL * 10,
  keypair = Keypair.generate()
): Promise<Keypair> {
  const account = keypair;
  const signature = await connection.requestAirdrop(
    account.publicKey,
    lamports
  );
  await connection.confirmTransaction(signature, "confirmed");
  return account;
}

export function getConnection(): Connection {
  const url = "http://127.0.0.1:8899";
  return new Connection(url, "confirmed");
}

export async function executeTransaction(
  connection: Connection,
  tx: Transaction,
  wallet: Wallet,
  config?: { signers?: Signer[]; silent?: boolean }
): Promise<string> {
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = wallet.publicKey;
  await wallet.signTransaction(tx);
  if (config?.signers) {
    tx.partialSign(...(config?.signers ?? []));
  }
  try {
    const txid = await sendAndConfirmRawTransaction(connection, tx.serialize());
    return txid;
  } catch (e) {
    if (!config?.silent) {
      handleError(e);
    }
    throw e;
  }
}

export async function executeTransactions(
  connection: Connection,
  txs: Transaction[],
  wallet: Wallet,
  config?: { signers?: Signer[]; silent?: boolean }
): Promise<string[]> {
  const latestBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const signedTxs = await wallet.signAllTransactions(
    txs.map((tx) => {
      tx.recentBlockhash = latestBlockhash;
      tx.feePayer = wallet.publicKey;
      if (config?.signers) {
        tx.partialSign(...(config?.signers ?? []));
      }
      return tx;
    })
  );
  const txids = await Promise.all(
    signedTxs.map(async (tx) => {
      try {
        const txid = await sendAndConfirmRawTransaction(
          connection,
          tx.serialize()
        );
        return txid;
      } catch (e) {
        if (!config?.silent) {
          handleError(e);
        }
        throw e;
      }
    })
  );
  return txids;
}

export type CardinalProvider = {
  connection: Connection;
  wallet: Wallet;
  keypair: Keypair;
};

export async function getProvider(): Promise<CardinalProvider> {
  const connection = getConnection();
  const keypair = await newAccountWithLamports(connection);
  const wallet = new Wallet(keypair);
  return {
    connection,
    wallet,
    keypair,
  };
}

export const keypairFrom = (s: string, n?: string): Keypair => {
  try {
    if (s.includes("[")) {
      return Keypair.fromSecretKey(
        Buffer.from(
          s
            .replace("[", "")
            .replace("]", "")
            .split(",")
            .map((c) => parseInt(c))
        )
      );
    } else {
      return Keypair.fromSecretKey(utils.bytes.bs58.decode(s));
    }
  } catch (e) {
    try {
      return Keypair.fromSecretKey(
        Buffer.from(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          JSON.parse(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-var-requires
            require("fs").readFileSync(s, {
              encoding: "utf-8",
            })
          )
        )
      );
    } catch (e) {
      process.stdout.write(`${n ?? "keypair"} is not valid keypair`);
      process.exit(1);
    }
  }
};

export const handleError = (e: any) => {
  const message = (e as SendTransactionError).message ?? "";
  const logs = (e as SendTransactionError).logs;
  if (logs) {
    console.log(logs, message);
  } else {
    console.log(e, message);
  }
};

const networkURLs: { [key: string]: { primary: string; secondary?: string } } =
  {
    ["mainnet-beta"]: {
      primary:
        process.env.MAINNET_PRIMARY || "https://solana-api.projectserum.com",
      secondary: "https://solana-api.projectserum.com",
    },
    mainnet: {
      primary:
        process.env.MAINNET_PRIMARY || "https://solana-api.projectserum.com",
      secondary: "https://solana-api.projectserum.com",
    },
    devnet: { primary: "https://api.devnet.solana.com/" },
    testnet: { primary: "https://api.testnet.solana.com/" },
    localnet: { primary: "http://localhost:8899/" },
  };

export const connectionFor = (
  cluster: string | null,
  defaultCluster = "mainnet"
) => {
  return new Connection(
    process.env.RPC_URL || networkURLs[cluster || defaultCluster]!.primary,
    "recent"
  );
};

export const secondaryConnectionFor = (
  cluster: string | null,
  defaultCluster = "mainnet"
) => {
  return new Connection(
    process.env.RPC_URL ||
      networkURLs[cluster || defaultCluster]?.secondary ||
      networkURLs[cluster || defaultCluster]!.primary,
    "recent"
  );
};

export const createMintTx = async (
  connection: Connection,
  mintId: PublicKey,
  authority: PublicKey,
  {
    target = authority,
    amount = 1,
    decimals = 0,
  }: { target?: PublicKey; amount?: number; decimals?: number }
) => {
  const ata = getAssociatedTokenAddressSync(mintId, target);
  return new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: authority,
      newAccountPubkey: mintId,
      space: MINT_SIZE,
      lamports: await getMinimumBalanceForRentExemptMint(connection),
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMint2Instruction(mintId, decimals, authority, authority),
    createAssociatedTokenAccountInstruction(authority, ata, target, mintId),
    createMintToInstruction(mintId, ata, authority, amount)
  );
};

export const createMasterEditionTx = async (
  connection: Connection,
  mintId: PublicKey,
  authority: PublicKey,
  target = authority
) => {
  const ata = getAssociatedTokenAddressSync(mintId, target);
  const editionId = await tokenMetadatV1.Edition.getPDA(mintId);
  const metadataId = await tokenMetadatV1.Metadata.getPDA(mintId);

  return new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: authority,
      newAccountPubkey: mintId,
      space: MINT_SIZE,
      lamports: await getMinimumBalanceForRentExemptMint(connection),
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMint2Instruction(mintId, 0, authority, authority),
    createAssociatedTokenAccountInstruction(authority, ata, target, mintId),
    createMintToInstruction(mintId, ata, authority, 1),
    createCreateMetadataAccountV2Instruction(
      {
        metadata: metadataId,
        mint: mintId,
        updateAuthority: authority,
        mintAuthority: authority,
        payer: authority,
      },
      {
        createMetadataAccountArgsV2: {
          data: {
            name: `name-${Math.random()}`,
            symbol: "SYMB",
            uri: `uri-${Math.random()}`,
            sellerFeeBasisPoints: 0,
            creators: [{ address: authority, share: 100, verified: true }],
            collection: null,
            uses: null,
          },
          isMutable: true,
        },
      }
    ),
    createCreateMasterEditionV3Instruction(
      {
        edition: editionId,
        mint: mintId,
        updateAuthority: authority,
        mintAuthority: authority,
        metadata: metadataId,
        payer: authority,
      },
      { createMasterEditionArgs: { maxSupply: 0 } }
    )
  );
};
