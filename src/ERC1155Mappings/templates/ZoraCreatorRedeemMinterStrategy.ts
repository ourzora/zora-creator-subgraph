import {
  RedeemInstructions,
  RedeemMinterProcessed,
  RedeemMintToken,
  SalesConfigRedeemMinterStrategy,
} from "../../../generated/schema";
import {
  RedeemProcessed,
  RedeemsCleared,
  RedeemSet,
} from "../../../generated/templates/ZoraCreatorRedeemMinterStrategy/ZoraCreatorRedeemMinterStrategy";
import { makeTransaction } from "../../common/makeTransaction";

export function handleRedeemCleared(event: RedeemsCleared): void {
  for (let i = 0; i < event.params.redeemInstructionsHashes.length; i++) {
    let redeem = SalesConfigRedeemMinterStrategy.load(
      `${event.params.redeemInstructionsHashes[i]}`
    );

    if (!redeem) {
      return;
    }

    redeem.isActive = false;
    redeem.save();
  }
}

export function handleRedeemProcessed(event: RedeemProcessed): void {
  const processed = new RedeemMinterProcessed(
    `${event.transaction.hash.toHex()}`
  );

  processed.txn = makeTransaction(event);
  processed.redeemMinter = event.params.redeemsInstructionsHash.toHex();
  processed.target = event.params.target;
  processed.redeemsInstructionsHash = event.params.redeemsInstructionsHash;
  processed.sender = event.params.sender;

  let amounts: string[] = [];
  for (let i = 0; i < event.params.amounts.length; i++) {
    let a: string[] = [];
    for (let j = 0; j < event.params.amounts[i].length; j++) {
      a.push(`${event.params.amounts[i][j]}`);
    }
    amounts.push(a.join(", "));
  }
  processed.amounts = amounts;

  let tokenIds: string[] = [];
  for (let i = 0; i < event.params.tokenIds.length; i++) {
    let t: string[] = [];
    for (let j = 0; j < event.params.tokenIds[i].length; j++) {
      t.push(`${event.params.tokenIds[i][j]}`);
    }
    tokenIds.push(t.join(", "));
  }
  processed.tokenIds = tokenIds;

  processed.save();
}

export function handleRedeemSet(event: RedeemSet): void {
  let strategy = new SalesConfigRedeemMinterStrategy(
    `${event.params.redeemsInstructionsHash}`
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
