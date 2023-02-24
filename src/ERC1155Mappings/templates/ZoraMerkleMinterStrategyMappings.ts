import { ERC1155SalesConfigMerkleMinterStrategy } from "../../../generated/schema";
import { SaleSet } from "../../../generated/templates/ZoraCreatorMerkleMinterStrategy/ZoraCreatorMerkleMinterStrategy";

export function handleMerkleMinterStrategySaleSet(event: SaleSet): void {
 
  const id = `-${event.address}-${event.params.tokenId}`; // fix
  const sale = new ERC1155SalesConfigMerkleMinterStrategy(id);
  sale.presaleStart = event.params.merkleSaleSettings.presaleStart;
  sale.presaleEnd = event.params.merkleSaleSettings.presaleEnd;
  sale.fundsRecipient = event.params.merkleSaleSettings.fundsRecipient;
  sale.merkleRoot = event.params.merkleSaleSettings.merkleRoot;
  sale.updatedAt = event.block.timestamp;

  sale.save();
}
