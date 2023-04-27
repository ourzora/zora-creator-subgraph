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
    const redeem = SalesConfigRedeemMinterStrategy.load(
      `${event.params.redeemInstructionsHashes[i]}`
    );

    if (redeem) {
      redeem.isActive = false;
      redeem.save();
    }
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
  processed.amounts = event.params.amounts;
  processed.tokenIds = event.params.tokenIds;

  processed.save();
}

export function handleRedeemSet(event: RedeemSet): void {
  const redemptionHash = event.params.redeemsInstructionsHash.toHex();

  const strategy = new SalesConfigRedeemMinterStrategy(redemptionHash);
  strategy.txn = makeTransaction(event);
  strategy.configAddress = event.address;
  strategy.target = event.params.target;
  strategy.redeemsInstructionsHash = event.params.redeemsInstructionsHash;

  const token = new RedeemMintToken(redemptionHash);
  token.tokenContract = event.params.data.mintToken.tokenContract;
  token.tokenId = event.params.data.mintToken.tokenId;
  token.amount = event.params.data.mintToken.amount;
  token.tokenType = event.params.data.mintToken.tokenType;
  token.save();

  strategy.redeemMintToken = token.id;

  for (let i = 0; i < event.params.data.instructions.length; i++) {
    // This can fail for duplicate Redeem Instructions – while it doesn't make sense that the user can input this
    // the safest way to index these is by array index.
    const redeemInstruction = new RedeemInstructions(`${redemptionHash}-${i}`);
    redeemInstruction.tokenType = event.params.data.instructions[i].tokenType;
    redeemInstruction.amount = event.params.data.instructions[i].amount;
    redeemInstruction.tokenIdStart =
      event.params.data.instructions[i].tokenIdStart;
    redeemInstruction.tokenIdEnd = event.params.data.instructions[i].tokenIdEnd;
    redeemInstruction.transferRecipient =
      event.params.data.instructions[i].transferRecipient;
    redeemInstruction.tokenContract =
      event.params.data.instructions[i].tokenContract;
    redeemInstruction.burnFunction =
      event.params.data.instructions[i].burnFunction;
    redeemInstruction.redeemMinter = strategy.id;
    redeemInstruction.save();
  }

  strategy.saleStart = event.params.data.saleStart;
  strategy.saleEnd = event.params.data.saleEnd;
  strategy.ethAmount = event.params.data.ethAmount;
  strategy.ethRecipient = event.params.data.ethRecipient;
  strategy.isActive = true;
  strategy.save();
}
