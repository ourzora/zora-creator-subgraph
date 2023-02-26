import { ERC1155SalesConfigMerkleMinterStrategy } from "../../../generated/schema";
import { SaleSet } from "../../../generated/templates/ZoraCreatorMerkleMinterStrategy/ZoraCreatorMerkleMinterStrategy";
import { makeTransaction } from "../../common/makeTransaction";

export function handleMerkleMinterStrategySaleSet(event: SaleSet): void {
  const id = `${event.address}-${event.params.sender}-${event.params.tokenId}`;
  let sale = ERC1155SalesConfigMerkleMinterStrategy.load(id);
  if (!sale) {
    sale = new ERC1155SalesConfigMerkleMinterStrategy(id);
  }

  sale.presaleStart = event.params.merkleSaleSettings.presaleStart;
  sale.presaleEnd = event.params.merkleSaleSettings.presaleEnd;
  sale.fundsRecipient = event.params.merkleSaleSettings.fundsRecipient;
  sale.merkleRoot = event.params.merkleSaleSettings.merkleRoot;
  sale.txn = makeTransaction(event)

  sale.save();
}
