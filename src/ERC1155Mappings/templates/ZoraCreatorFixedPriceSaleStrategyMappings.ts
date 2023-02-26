import {
  SaleSet
} from "../../../generated/templates/ZoraCreatorFixedPriceSaleStrategy/ZoraCreatorFixedPriceSaleStrategy";

export function handleFixedPriceStrategySaleSet(event: SaleSet): void {
  const id = `${event.address}-${event.params.mediaContract}-${event.params.tokenId}`;
  
}