export * from './RewardDistributor'
export * from './RewardEntry'

import { RewardEntry } from './RewardEntry'
import { RewardDistributor } from './RewardDistributor'

export const accountProviders = { RewardEntry, RewardDistributor }
