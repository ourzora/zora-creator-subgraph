import { BigInt } from "@graphprotocol/graph-ts";
import {
  ERC1155SalesConfigFixedPriceSaleStrategy,
  ERC1155SalesStrategyConfig,
} from "../../../generated/schema";
import { SaleSet } from "../../../generated/templates/ZoraCreatorFixedPriceSaleStrategy/ZoraCreatorFixedPriceSaleStrategy";
import { makeTransaction } from "../../common/makeTransaction";

export function handleFixedPriceStrategySaleSet(event: SaleSet): void {
  const id = `${event.address.toHex()}-${event.params.mediaContract.toHex()}-${event.params.tokenId.toString()}`;
  const sale = new ERC1155SalesConfigFixedPriceSaleStrategy(id);
  sale.contract = event.params.mediaContract.toHex();
  sale.fundsRecipient = event.params.salesConfig.fundsRecipient;
  sale.pricePerToken = event.params.salesConfig.pricePerToken;
  sale.saleStart = event.params.salesConfig.saleStart;
  sale.saleEnd = event.params.salesConfig.saleEnd;
  sale.maxTokensPerAddress = event.params.salesConfig.maxTokensPerAddress;
  sale.maxTokensPerTransaction = BigInt.fromI32(0);
  const txn = makeTransaction(event);
  sale.txn = txn;
  sale.tokenId = event.params.tokenId;
  sale.save();

  // add join
  const saleJoin = new ERC1155SalesStrategyConfig(id);
  if (event.params.tokenId.equals(BigInt.zero())) {
    saleJoin.contract = event.params.mediaContract.toHex();
  } else {
    saleJoin.tokenAndContract = `${event.params.mediaContract.toHex()}-${event.params.tokenId.toString()}`;
  }
  saleJoin.fixedPrice = id;
  saleJoin.type = "fixedPrice";
  saleJoin.txn = txn;
  saleJoin.save();
}
