import {
  SaleSet
} from "../../../generated/templates/ZoraCreatorFixedPriceSaleStrategy/ZoraCreatorFixedPriceSaleStrategy";

export function handleFixedPriceStrategySaleSet(event: SaleSet): void {
  const id = `${event.address.toHex()}-${event.params.mediaContract.toHex()}-${event.params.tokenId.toString()}`;

}