import { Identifier } from "./Identifier";
import { StakeAuthorizationRecord } from "./StakeAuthorizationRecord";
import { StakeBooster } from "./StakeBooster";
import { StakeEntry } from "./StakeEntry";
import { StakePool } from "./StakePool";

export * from "./Identifier";
export * from "./StakeAuthorizationRecord";
export * from "./StakeBooster";
export * from "./StakeEntry";
export * from "./StakePool";

export const accountProviders = {
  StakeEntry,
  StakePool,
  StakeBooster,
  StakeAuthorizationRecord,
  Identifier,
};
