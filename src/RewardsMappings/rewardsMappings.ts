import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  RewardsPerUser,
  RewardsPerUserPerDay,
  RewardsSingleDeposit,
  RewardsDeposit,
  RewardsWithdraw,
  RewardsPerUserPerSource,
  RewardsAggregate,
} from "../../generated/schema";
import {
  Deposit as DepositEvent,
  RewardsDeposit as RewardsDepositEvent,
  Withdraw as WithdrawEvent,
} from "../../generated/templates/ProtocolRewards/ProtocolRewards";
import { makeTransaction } from "../common/makeTransaction";

function addRewardInfoToUser(
  from: Address,
  user: Address,
  amount: BigInt,
  timestamp: BigInt
): void {
  let creatorRewards = RewardsPerUser.load(user);
  if (!creatorRewards) {
    creatorRewards = new RewardsPerUser(user);
  }
  creatorRewards.amount = creatorRewards.amount.plus(amount);
  creatorRewards.amountToWithdraw = creatorRewards.amount.plus(amount);
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
  let rewardsPerUserPerSource = RewardsPerUserPerSource.load(
    rewardsPerSourceKey
  );
  if (rewardsPerUserPerSource) {
    rewardsPerUserPerSource = new RewardsPerUserPerSource(
      `${from.toHex()}-${user.toHex()}`
    );
    rewardsPerUserPerSource.to = user;
    rewardsPerUserPerSource.from = from;
    rewardsPerUserPerSource.amount = amount;
    rewardsPerUserPerSource.save();
  }

  creatorRewards.save();

  let rewardsTotal = RewardsAggregate.load('AGGREGATE');
  if (!rewardsTotal) {
    rewardsTotal = new RewardsAggregate('AGGREGATE');
  }
  rewardsTotal.amount = rewardsTotal.amount.plus(amount);
  rewardsTotal.amountToWithdraw = rewardsTotal.amountToWithdraw.plus(amount);
  rewardsTotal.save();
}

function addSingleDeposit(
  event: ethereum.Event,
  from: Address,
  to: Address,
  amount: BigInt,
  comment: string
): void {
  const customDeposit = new RewardsSingleDeposit(
    `${event.transaction.hash.toHex()}-${event.transactionLogIndex}-${comment}`
  );
  customDeposit.from = from;
  customDeposit.to = to;
  customDeposit.amount = amount;
  customDeposit.comment = comment;
  customDeposit.save();

  addRewardInfoToUser(from, to, amount, event.block.timestamp);
}

export function handleRewardsDeposit(event: RewardsDepositEvent): void {
  const rewardsDeposit = new RewardsDeposit(
    `${event.transaction.hash}-${event.transactionLogIndex}`
  );
  rewardsDeposit.address = event.address;
  rewardsDeposit.block = event.block.number;
  rewardsDeposit.timestamp = event.block.timestamp;
  rewardsDeposit.txn = makeTransaction(event);

  rewardsDeposit.from = event.params.from;
  rewardsDeposit.creator = event.params.creator;
  rewardsDeposit.creatorReward = event.params.creatorReward;
  rewardsDeposit.createReferral = event.params.createReferral;
  rewardsDeposit.createReferralReward = event.params.createReferralReward;
  rewardsDeposit.mintReferral = event.params.mintReferral;
  rewardsDeposit.mintReferralReward = event.params.mintReferralReward;
  rewardsDeposit.firstMinter = event.params.firstMinter;
  rewardsDeposit.firstMinterReward = event.params.firstMinterReward;
  rewardsDeposit.zora = event.params.zora;
  rewardsDeposit.zoraReward = event.params.zoraReward;

  rewardsDeposit.save();

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
  const withdraw = new RewardsWithdraw(
    `${event.transaction.hash.toHex()}-${event.transactionLogIndex}`
  );
  withdraw.address = event.address;
  withdraw.amount = event.params.amount;
  withdraw.from = event.params.from;
  withdraw.to = event.params.to;
  withdraw.timestamp = event.block.timestamp;
  withdraw.block = event.block.number;
  withdraw.txn = event.transaction.hash.toHex();
  withdraw.save();

  const rewards = RewardsPerUser.load(event.params.to);
  if (rewards) {
    rewards.amountToWithdraw = rewards.amountToWithdraw.minus(
      event.params.amount
    );
    rewards.save();
  }
  const rewardsTotal = RewardsAggregate.load("AGGREGATE");
  if (rewardsTotal) {
    rewardsTotal.amountToWithdraw = rewardsTotal.amount.minus(
      event.params.amount
    );
    rewardsTotal.save();
  }
}

export function handleDeposit(event: DepositEvent): void {
  const deposit = new RewardsSingleDeposit(getEventId(event));

  deposit.address = event.address;
  deposit.block = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.txn = makeTransaction(event);

  deposit.from = event.params.from;
  deposit.to = event.params.to;
  deposit.amount = event.params.amount;
  deposit.reason = event.params.reason;
  deposit.comment = event.params.comment;

  addRewardInfoToUser(event.params.from, event.params.to, event.params.amount, event.block.timestamp);

  deposit.save();
}

function getEventId(event: ethereum.Event): string {
  return `${event.transaction.hash.toHex()}-${event.logIndex}`;
}
