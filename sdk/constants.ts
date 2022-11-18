import { PublicKey } from "@solana/web3.js";

import { IDL } from "./idl/cardinal_rewards_center";

export const REWARDS_CENTER_IDL = IDL;

export const DEFAULT_PAYMENT_INFO = new PublicKey(
  "3dxFgrZt9DLn1J5ZB1bDwjeDvbESzNxA11KggRcywKbm"
);
