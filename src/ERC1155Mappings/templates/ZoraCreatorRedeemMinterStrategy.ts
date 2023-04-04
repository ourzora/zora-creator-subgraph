import {
  RedeemInstructions,
  RedeemToken,
  SalesConfigRedeemMinterStrategy,
} from "../../../generated/schema";
import {
  RedeemCleared,
  RedeemProcessed,
  RedeemSet,
} from "../../../generated/templates/ZoraCreatorRedeemMinterStrategy/ZoraCreatorRedeemMinterStrategy";
import { makeTransaction } from "../../common/makeTransaction";

export function handleRedeemCleared(event: RedeemCleared): void {
  const redeem = SalesConfigRedeemMinterStrategy.load(
    `${event.address.toHexString()}`
  );
  if (!redeem) {
    return;
  }

  redeem.target = event.params.target;
  redeem.redeemsInstructionsHash = event.params.redeemInstructionsHash;
  redeem.save();
}

export function handleRedeemProcessed(event: RedeemProcessed): void {
  const redeem = SalesConfigRedeemMinterStrategy.load(
    `${event.address.toHexString()}`
  );
  if (!redeem) {
    return;
  }

  redeem.target = event.params.target;
  redeem.redeemsInstructionsHash = event.params.redeemsInstructionsHash;
  redeem.save();
}

export function handleRedeemSet(event: RedeemSet): void {
  let strategy = new SalesConfigRedeemMinterStrategy(
    `${event.address.toHexString()}`
  );
  strategy.txn = makeTransaction(event);
  strategy.configAddress = event.address;
  strategy.target = event.params.target;
  strategy.redeemsInstructionsHash = event.params.redeemsInstructionsHash;

  let token = new RedeemToken(
    `${event.address.toHexString()}-${event.params.data.redeemToken.tokenId}`
  );
  token.tokenContract = event.params.data.redeemToken.tokenContract;
  token.tokenId = event.params.data.redeemToken.tokenId;
  token.amount = event.params.data.redeemToken.amount;
  token.tokenType = event.params.data.redeemToken.tokenType;
  token.save();

  strategy.redeemToken = token;

  let instructions = [];
  for (let i = 0; i < event.params.data.instructions.length; i++) {
    let j = new RedeemInstructions(
      `${event.params.data.instructions[i].tokenContract}-${event.params.data.instructions[i].tokenIdStart}-${event.params.data.instructions[i].tokenIdEnd}`
    );
    j.tokenType = event.params.data.instructions[i].tokenType;
    j.amount = event.params.data.instructions[i].amount;
    j.tokenIdStart = event.params.data.instructions[i].tokenIdStart;
    j.tokenIdEnd = event.params.data.instructions[i].tokenIdEnd;
    j.transferRecipient = event.params.data.instructions[i].transferRecipient;
    j.tokenContract = event.params.data.instructions[i].tokenContract;
    j.burnFunction = event.params.data.instructions[i].burnFunction;
    j.save();
    instructions.push(j);
  }
  strategy.redeemInstructions = instructions;
  strategy.saleStart = event.params.data.saleStart;
  strategy.saleEnd = event.params.data.saleEnd;
  strategy.ethAmount = event.params.data.ethAmount;
  strategy.ethRecipient = event.params.data.ethRecipient;
  strategy.save();
}
