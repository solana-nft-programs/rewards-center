import type { Idl } from "@project-serum/anchor";
import { AnchorProvider, Program } from "@project-serum/anchor";
import type {
  AllAccountsMap,
  IdlTypes,
  TypeDef,
} from "@project-serum/anchor/dist/cjs/program/namespace/types";
import type { Wallet } from "@project-serum/anchor/dist/cjs/provider";
import type { AccountInfo, ConfirmOptions, Connection } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

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

export type IDLAccountInfo<IDL extends Idl = CardinalRewardsCenter> = {
  [T in keyof AllAccountsMap<IDL>]: AccountInfo<Buffer> & {
    type: T;
    parsed: TypeDef<AllAccountsMap<IDL>[T], IdlTypes<IDL>>;
  };
};

export type IDLAccount<IDL extends Idl = CardinalRewardsCenter> = {
  [T in keyof AllAccountsMap<IDL>]: {
    pubkey: PublicKey;
  } & IDLAccountInfo<IDL>[T];
};

export const CLAIM_REWARDS_PAYMENT_INFO = new PublicKey(
  "CUeHFsFqfbLfBGSbuNbaAi4wK6V835PoRg1CqCLo8tpM"
);

export type RewardDistributor = IDLAccount["rewardDistributor"];
export type RewardEntry = IDLAccount["rewardEntry"];
export type StakePool = IDLAccount["stakePool"];
export type StakeEntry = IDLAccount["stakeEntry"];
export type ReceiptManager = IDLAccount["receiptManager"];
export type RewardReceipt = IDLAccount["rewardReceipt"];
export type StakeBooster = IDLAccount["stakeBooster"];
export type StakeAuthorizationRecord = IDLAccount["stakeAuthorizationRecord"];
export type PaymentInfo = IDLAccount["paymentInfo"];
export type PaymentShare = {
  address: PublicKey;
  basisPoints: number;
};

export const rewardsCenterProgram = (
  connection: Connection,
  wallet: Wallet,
  opts?: ConfirmOptions
) => {
  return new Program<CardinalRewardsCenter>(
    REWARDS_CENTER_IDL,
    REWARDS_CENTER_ADDRESS,
    new AnchorProvider(connection, wallet, opts ?? {})
  );
};
