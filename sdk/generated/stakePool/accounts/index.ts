export * from './Identifier'
export * from './StakeAuthorizationRecord'
export * from './StakeBooster'
export * from './StakeEntry'
export * from './StakePool'

import { StakeEntry } from './StakeEntry'
import { StakePool } from './StakePool'
import { StakeBooster } from './StakeBooster'
import { StakeAuthorizationRecord } from './StakeAuthorizationRecord'
import { Identifier } from './Identifier'

export const accountProviders = {
  StakeEntry,
  StakePool,
  StakeBooster,
  StakeAuthorizationRecord,
  Identifier,
}
