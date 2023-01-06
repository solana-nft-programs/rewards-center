import { BN } from "@coral-xyz/anchor";

import type { RewardDistributor, RewardEntry, StakeEntry } from "./constants";

/**
 * Get the map of rewards for stakeEntry to rewards and next reward time
 * Also return the total claimable rewards from this map
 * @param stakeEntries
 * @param rewardEntries
 * @param rewardDistributor
 * @param remainingRewardAmount
 * @returns
 */
export const getRewardMap = (
  stakeEntries: StakeEntry[],
  rewardEntries: RewardEntry[],
  rewardDistributor: RewardDistributor,
  remainingRewardAmount: BN,
  UTCNow: number
): {
  rewardMap: {
    [stakeEntryId: string]: { claimableRewards: BN; nextRewardsIn: BN };
  };
  claimableRewards: BN;
} => {
  const rewardMap: {
    [stakeEntryId: string]: { claimableRewards: BN; nextRewardsIn: BN };
  } = {};

  for (let i = 0; i < stakeEntries.length; i++) {
    const stakeEntry = stakeEntries[i]!;
    const rewardEntry = rewardEntries.find((rewardEntry) =>
      rewardEntry?.parsed?.stakeEntry.equals(stakeEntry?.pubkey)
    );

    if (stakeEntry) {
      const [claimableRewards, nextRewardsIn] = calculatePendingRewards(
        rewardDistributor,
        stakeEntry,
        rewardEntry,
        remainingRewardAmount,
        UTCNow
      );
      rewardMap[stakeEntry.pubkey.toString()] = {
        claimableRewards,
        nextRewardsIn,
      };
    }
  }

  // Compute too many rewards
  let claimableRewards = Object.values(rewardMap).reduce(
    (acc, { claimableRewards }) => acc.add(claimableRewards),
    new BN(0)
  );

  if (claimableRewards.gt(remainingRewardAmount)) {
    claimableRewards = remainingRewardAmount;
  }
  return { rewardMap, claimableRewards };
};

/**
 * Calculate claimable rewards and next reward time for a give mint and reward and stake entry
 * @param rewardDistributor
 * @param stakeEntry
 * @param rewardEntry
 * @param remainingRewardAmount
 * @param UTCNow
 * @returns
 */
export const calculatePendingRewards = (
  rewardDistributor: RewardDistributor,
  stakeEntry: StakeEntry,
  rewardEntry: RewardEntry | undefined,
  remainingRewardAmount: BN,
  UTCNow: number
): [BN, BN] => {
  if (
    !stakeEntry ||
    stakeEntry.parsed.pool.toString() !==
      rewardDistributor.parsed.stakePool.toString()
  ) {
    return [new BN(0), new BN(0)];
  }

  const rewardSecondsReceived =
    rewardEntry?.parsed.rewardSecondsReceived || new BN(0);
  const multiplier =
    rewardEntry?.parsed?.multiplier ||
    rewardDistributor.parsed.defaultMultiplier;
  const currentSeconds = stakeEntry.parsed.cooldownStartSeconds
    ? new BN(stakeEntry.parsed.cooldownStartSeconds)
    : new BN(UTCNow);

  let rewardSeconds = currentSeconds
    .sub(new BN(stakeEntry.parsed.lastStakedAt))
    .mul(new BN(stakeEntry.parsed.amount))
    .add(new BN(stakeEntry.parsed.totalStakeSeconds));

  if (rewardDistributor.parsed.maxRewardSecondsReceived) {
    rewardSeconds = BN.min(
      rewardSeconds,
      new BN(rewardDistributor.parsed.maxRewardSecondsReceived)
    );
  }

  let rewardAmountToReceive = rewardSeconds
    .sub(new BN(rewardSecondsReceived))
    .div(new BN(rewardDistributor.parsed.rewardDurationSeconds))
    .mul(new BN(rewardDistributor.parsed.rewardAmount))
    .mul(new BN(multiplier))
    .div(new BN(10).pow(new BN(rewardDistributor.parsed.multiplierDecimals)));

  if (rewardAmountToReceive.gt(remainingRewardAmount)) {
    rewardAmountToReceive = remainingRewardAmount;
  }

  const nextRewardsIn = new BN(
    rewardDistributor.parsed.rewardDurationSeconds
  ).sub(
    currentSeconds
      .sub(new BN(stakeEntry.parsed.lastStakedAt))
      .add(new BN(stakeEntry.parsed.totalStakeSeconds))
      .mod(new BN(rewardDistributor.parsed.rewardDurationSeconds))
  );

  return [rewardAmountToReceive, nextRewardsIn];
};
