import { PublicKey } from "@solana/web3.js";

import { IDL } from "./idl/cardinal_rewards_center";

export const REWARDS_CENTER_IDL = IDL;

export const REWARD_MANAGER_ID = new PublicKey(
  "crkdpVWjHWdggGgBuSyAqSmZUmAjYLzD435tcLDRLXr"
);

export const STAKE_POOL_PAYMENT_MANAGER_ID = new PublicKey(
  "CuEDMUqgkGTVcAaqEDHuVR848XN38MPsD11JrkxcGD6a"
);

export const RECEIPT_MANAGER_PAYMENT_MANAGER_ID = new PublicKey(
  "FQJ2czigCYygS8v8trLU7TBAi7NjRN1h1C2vLAh2GYDi"
);

export const STAKE_BOOSTER_PAYMENT_MANAGER_ID = new PublicKey(
  "CuEDMUqgkGTVcAaqEDHuVR848XN38MPsD11JrkxcGD6a"
);
