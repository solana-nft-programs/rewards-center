import { emptyWallet } from "@cardinal/common";
import { Program } from "@project-serum/anchor";
import type { Wallet } from "@project-serum/anchor/dist/cjs/provider";
import { AnchorProvider } from "@project-serum/anchor/dist/cjs/provider";
import type { ConfirmOptions, Connection } from "@solana/web3.js";
import { Keypair, PublicKey } from "@solana/web3.js";

import type { CardinalRewardsCenter } from "./idl/cardinal_rewards_center";
import { IDL } from "./idl/cardinal_rewards_center";

export const REWARDS_CENTER_IDL = IDL;

export const REWARDS_CENTER_ADDRESS = new PublicKey(
  "rwcn6Ry17ChPXpJCN2hoK5kwpgFarQqzycXwVJ3om7U"
);

export const SOL_PAYMENT_INFO = new PublicKey(
  "3dxFgrZt9DLn1J5ZB1bDwjeDvbESzNxA11KggRcywKbm"
);

export const WRAPPED_SOL_PAYMENT_INFO = new PublicKey(
  "AmJdpbtEzFBVWhznaEQM3V4fNZBa8FWj36Lu2BtnaDYt"
);

export const DUST_PAYMENT_INFO = new PublicKey(
  "AmJdpbtEzFBVWhznaEQM3V4fNZBa8FWj36Lu2BtnaDYt"
);

export const CLAIM_REWARDS_PAYMENT_INFO = new PublicKey(
  "CUeHFsFqfbLfBGSbuNbaAi4wK6V835PoRg1CqCLo8tpM"
);

export const rewardsCenterProgram = (
  connection: Connection,
  wallet: Wallet,
  opts?: ConfirmOptions
) => {
  return new Program<CardinalRewardsCenter>(
    REWARDS_CENTER_IDL,
    REWARDS_CENTER_ADDRESS,
    new AnchorProvider(
      connection,
      wallet ?? emptyWallet(Keypair.generate().publicKey),
      opts ?? {}
    )
  );
};
