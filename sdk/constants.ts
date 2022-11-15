import { PublicKey } from "@solana/web3.js";

import { IDL } from "./idl/cardinal_rewards_center";

export const REWARDS_CENTER_ADDRESS = new PublicKey(
  "rwcg7ZBhxV8ViZvueh5kRuQXkTGD8TmcoPmEpDutCUJ"
);

export const REWARDS_CENTER_IDL = IDL;
