export * from './ReceiptEntry'
export * from './ReceiptManager'
export * from './RewardDistributor'
export * from './RewardEntry'
export * from './RewardReceipt'
export * from './StakeAuthorizationRecord'
export * from './StakeBooster'
export * from './StakeEntry'
export * from './StakePool'

import { StakeAuthorizationRecord } from './StakeAuthorizationRecord'
import { RewardEntry } from './RewardEntry'
import { RewardDistributor } from './RewardDistributor'
import { ReceiptManager } from './ReceiptManager'
import { ReceiptEntry } from './ReceiptEntry'
import { RewardReceipt } from './RewardReceipt'
import { StakeBooster } from './StakeBooster'
import { StakeEntry } from './StakeEntry'
import { StakePool } from './StakePool'

export const accountProviders = {
  StakeAuthorizationRecord,
  RewardEntry,
  RewardDistributor,
  ReceiptManager,
  ReceiptEntry,
  RewardReceipt,
  StakeBooster,
  StakeEntry,
  StakePool,
}
