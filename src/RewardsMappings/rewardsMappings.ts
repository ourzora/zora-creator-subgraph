import { ethereum } from '@graphprotocol/graph-ts'

import {
  RewardsDeposit as RewardsDepositEvent,
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
} from '../../generated/ProtocolRewardsV1/ProtocolRewards'
import {
  RewardsDeposit as RewardsDepositEntity,
  Deposit as DepositEntity,
  Withdraw as WithdrawEntity,
} from '../../generated/schema'
import { makeTransaction } from '../common/makeTransaction'

export function handleRewardsDeposit(event: RewardsDepositEvent): void {
  const rewardsDeposit = new RewardsDepositEntity(getEventId(event))

  rewardsDeposit.address = event.address
  rewardsDeposit.block = event.block.number
  rewardsDeposit.timestamp = event.block.timestamp
  rewardsDeposit.txn = makeTransaction(event)

  rewardsDeposit.from = event.params.from
  rewardsDeposit.creator = event.params.creator
  rewardsDeposit.creatorReward = event.params.creatorReward
  rewardsDeposit.createReferral = event.params.createReferral
  rewardsDeposit.createReferralReward = event.params.createReferralReward
  rewardsDeposit.mintReferral = event.params.mintReferral
  rewardsDeposit.mintReferralReward = event.params.mintReferralReward
  rewardsDeposit.firstMinter = event.params.firstMinter
  rewardsDeposit.firstMinterReward = event.params.firstMinterReward
  rewardsDeposit.zora = event.params.zora
  rewardsDeposit.zoraReward = event.params.zoraReward

  rewardsDeposit.save()
}

export function handleDeposit(event: DepositEvent): void {
  const deposit = new DepositEntity(getEventId(event))

  deposit.address = event.address
  deposit.block = event.block.number
  deposit.timestamp = event.block.timestamp
  deposit.txn = makeTransaction(event)

  deposit.from = event.params.from
  deposit.to = event.params.to
  deposit.amount = event.params.amount
  deposit.reason = event.params.reason
  deposit.comment = event.params.comment

  deposit.save()
}

export function handleWithdraw(event: WithdrawEvent): void {
    const withdraw = new WithdrawEntity(getEventId(event))
    
    withdraw.address = event.address
    withdraw.block = event.block.number
    withdraw.timestamp = event.block.timestamp
    withdraw.txn = makeTransaction(event)
    
    withdraw.from = event.params.from
    withdraw.to = event.params.to
    withdraw.amount = event.params.amount
    
    withdraw.save()
}

function getEventId(event: ethereum.Event): string {
  return `${event.transaction.hash.toHex()}-${event.logIndex}`
}
