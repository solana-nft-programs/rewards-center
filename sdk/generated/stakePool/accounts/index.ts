export * from './StakeAuthorizationRecord'
export * from './StakeBooster'
export * from './StakeEntry'
export * from './StakePool'

import { StakeAuthorizationRecord } from './StakeAuthorizationRecord'
import { StakeBooster } from './StakeBooster'
import { StakeEntry } from './StakeEntry'
import { StakePool } from './StakePool'

export const accountProviders = {
  StakeAuthorizationRecord,
  StakeBooster,
  StakeEntry,
  StakePool,
}
