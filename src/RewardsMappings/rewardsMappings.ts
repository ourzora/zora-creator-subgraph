import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  RewardsPerUser,
  RewardsPerUserPerDay,
  RewardsSingleDeposit,
  RewardsDeposit,
  RewardsWithdraw,
  RewardsPerUserPerSource,
} from "../../generated/schema";
import {
  Deposit as DepositEvent,
  RewardsDeposit as RewardsDepositEvent,
  Withdraw as WithdrawEvent,
} from "../../generated/templates/ProtocolRewards/ProtocolRewards";

function addRewardInfoToUser(from: Address, user: Address, amount: BigInt, timestamp: BigInt): void {
  let creatorRewards = RewardsPerUser.load(user);
  if (!creatorRewards) {
    creatorRewards = new RewardsPerUser(user);
  }
  creatorRewards.amount = creatorRewards.amount.plus(amount);
  creatorRewards.amountPending = creatorRewards.amount.plus(amount);
  const isoString = new Date(timestamp.toI64() * 1000)
    .toISOString()
    .substring(0, 10);
  const rewardsPerUserPerDayKey = `${user.toHex()}-${isoString}`;
  let rewardsPerUserPerDay = RewardsPerUserPerDay.load(rewardsPerUserPerDayKey);
  if (!rewardsPerUserPerDay) {
    rewardsPerUserPerDay = new RewardsPerUserPerDay(rewardsPerUserPerDayKey);
  }
  rewardsPerUserPerDay.amount = rewardsPerUserPerDay.amount.plus(amount);
  rewardsPerUserPerDay.to = user;
  rewardsPerUserPerDay.save();

const rewardsPerSourceKey = `${from.toHex()}-${user.toHex()}`;
  let rewardsPerUserPerSource = RewardsPerUserPerSource.load(rewardsPerSourceKey);
  if (rewardsPerUserPerSource) {
    rewardsPerUserPerSource = new RewardsPerUserPerSource(`${from.toHex()}-${user.toHex()}`);
    rewardsPerUserPerSource.to = user;
    rewardsPerUserPerSource.from = from;
    rewardsPerUserPerSource.amount = amount;
    rewardsPerUserPerSource.save();
  }

  creatorRewards.save();
}

function addSingleDeposit(
  event: ethereum.Event,
  from: Address,
  to: Address,
  amount: BigInt,
  reason: string
): void {
  const customDeposit = new RewardsSingleDeposit(
    `${event.transaction.hash.toHex()}-${event.transactionLogIndex}-${reason}`
  );
  customDeposit.from = from;
  customDeposit.to = to;
  customDeposit.reason = reason;
  customDeposit.amount = amount;
  customDeposit.save();

  addRewardInfoToUser(from, to, amount, event.block.timestamp);
}

export function handleDeposit(event: DepositEvent): void {
  addSingleDeposit(
    event,
    event.params.from,
    event.params.to,
    event.params.amount,
    event.params.reason.toHex()
  );
}

export function handleRewardsDeposit(event: RewardsDepositEvent): void {
  const rewardsDeposit = new RewardsDeposit(
    `${event.transaction.hash}-${event.transactionLogIndex}`
  );

  // create referral
  if (event.params.createReferralReward.gt(BigInt.fromI32(0))) {
    addSingleDeposit(
      event,
      event.params.from,
      event.params.createReferral,
      event.params.createReferralReward,
      "referral_reward"
    );
  }

  addSingleDeposit(
    event,
    event.params.from,
    event.params.creator,
    event.params.creatorReward,
    "creator"
  );

  if (event.params.firstMinterReward.gt(BigInt.zero())) {
    addSingleDeposit(
      event,
      event.params.from,
      event.params.firstMinter,
      event.params.firstMinterReward,
      "first_minter"
    );
  }

  if (event.params.mintReferralReward.gt(BigInt.zero())) {
    addSingleDeposit(
      event,
      event.params.from,
      event.params.mintReferral,
      event.params.mintReferralReward,
      "first_minter"
    );
  }

  addSingleDeposit(
    event,
    event.params.from,
    event.params.zora,
    event.params.zoraReward,
    "zora"
  );

  rewardsDeposit.save();
}

export function handleWithdraw(event: WithdrawEvent): void {
    const withdraw = new RewardsWithdraw(`${event.transaction.hash.toHex()}-${event.transactionLogIndex}`);
    withdraw.amount = event.params.amount;
    withdraw.owner = event.params.from;
    withdraw.recipient = event.params.to;
    withdraw.timestamp = event.block.timestamp;
    withdraw.block = event.block.number;
    withdraw.txn = event.transaction.hash.toHex();
    withdraw.save();

    const rewards = RewardsPerUser.load(event.params.to); 
    if (rewards) {
        rewards.amountPending = rewards.amountPending.minus(event.params.amount);
        rewards.save();
    }
    
}
