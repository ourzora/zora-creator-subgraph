import {
  RedeemInstructions,
  RedeemMintToken,
  SalesConfigRedeemMinterStrategy,
  RedeemInstructionHash,
} from "../../../generated/schema";
import {
  RedeemProcessed,
  RedeemsCleared,
  RedeemSet,
} from "../../../generated/templates/ZoraCreatorRedeemMinterStrategy/ZoraCreatorRedeemMinterStrategy";
import { makeTransaction } from "../../common/makeTransaction";

export function handleRedeemCleared(event: RedeemsCleared): void {
  const redeem = SalesConfigRedeemMinterStrategy.load(
    `${event.address.toHexString()}`
  );
  if (!redeem) {
    return;
  }

  redeem.target = event.params.target;

//   not totally sure on this
  for (let i = 0; i < event.params.redeemInstructionsHashes.length; i++) {
    let j = new RedeemInstructionHash(
      event.params.redeemInstructionsHashes[i].toString()
    );
    j.hash = event.params.redeemInstructionsHashes[i];
    j.redeemMinter = redeem.id;
    j.save();
  }

  redeem.isActive = false;
  redeem.save();
}

export function handleRedeemProcessed(event: RedeemProcessed): void {
  //   const redeem = SalesConfigRedeemMinterStrategy.load(
  //     `${event.address.toHexString()}`
  //   );
  //   if (!redeem) {
  //     return;
  //   }
  //   redeem.target = event.params.target;
  //   redeem.redeemsInstructionsHash = event.params.redeemsInstructionsHash;
  //   redeem.save();
}

export function handleRedeemSet(event: RedeemSet): void {
  let strategy = new SalesConfigRedeemMinterStrategy(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
  );
  strategy.txn = makeTransaction(event);
  strategy.configAddress = event.address;
  strategy.target = event.params.target;
  strategy.redeemsInstructionsHash = event.params.redeemsInstructionsHash;

  let token = new RedeemMintToken(
    `${event.address.toHexString()}-${event.params.data.mintToken.tokenId}`
  );
  token.tokenContract = event.params.data.mintToken.tokenContract;
  token.tokenId = event.params.data.mintToken.tokenId;
  token.amount = event.params.data.mintToken.amount;
  token.tokenType = event.params.data.mintToken.tokenType;
  token.save();

  strategy.redeemMintToken = token.id;

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
    j.redeemMinter = strategy.id;
    j.save();
  }

  strategy.saleStart = event.params.data.saleStart;
  strategy.saleEnd = event.params.data.saleEnd;
  strategy.ethAmount = event.params.data.ethAmount;
  strategy.ethRecipient = event.params.data.ethRecipient;
  strategy.isActive = true;
  strategy.save();
}
