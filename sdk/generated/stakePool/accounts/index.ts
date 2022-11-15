export * from './StakeAuthorizationRecord'
export * from './StakeBooster'
export * from './StakeEntry'
export * from './StakePool'

import { StakeAuthorizationRecord } from './StakeAuthorizationRecord'
import { StakeEntry } from './StakeEntry'
import { StakePool } from './StakePool'
import { StakeBooster } from './StakeBooster'

export const accountProviders = {
  StakeAuthorizationRecord,
  StakeEntry,
  StakePool,
  StakeBooster,
}
