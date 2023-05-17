import { BigInt } from "@graphprotocol/graph-ts";
import {
  SalesConfigFixedPriceSaleStrategy,
  SalesStrategyConfig,
} from "../../../generated/schema";
import { SaleSet } from "../../../generated/templates/ZoraCreatorFixedPriceSaleStrategy/ZoraCreatorFixedPriceSaleStrategy";
import { getSalesConfigKey } from "../../common/getSalesConfigKey";
import { getTokenId } from "../../common/getTokenId";
import { makeTransaction } from "../../common/makeTransaction";
import { SALE_CONFIG_FIXED_PRICE } from "../../constants/salesConfigTypes";

export function handleFixedPriceStrategySaleSet(event: SaleSet): void {
  const id = getSalesConfigKey(event.address, event.params.mediaContract, event.params.tokenId)
  const sale = new SalesConfigFixedPriceSaleStrategy(id);
  sale.configAddress = event.address;
  sale.contract = event.params.mediaContract.toHex();
  sale.fundsRecipient = event.params.salesConfig.fundsRecipient;
  sale.pricePerToken = event.params.salesConfig.pricePerToken;
  sale.saleStart = event.params.salesConfig.saleStart;
  sale.saleEnd = event.params.salesConfig.saleEnd;
  sale.maxTokensPerAddress = event.params.salesConfig.maxTokensPerAddress;

  const txn = makeTransaction(event);
  sale.txn = txn;
  sale.block = event.block.number;
  sale.timestamp = event.block.timestamp;
  sale.address = event.address;

  sale.tokenId = event.params.tokenId;
  sale.save();

  // add join
  const saleJoin = new SalesStrategyConfig(id);
  if (event.params.tokenId.equals(BigInt.zero())) {
    saleJoin.contract = event.params.mediaContract.toHex();
  } else {
    saleJoin.tokenAndContract = getTokenId(event.params.mediaContract, event.params.tokenId);
  }
  saleJoin.fixedPrice = id;
  saleJoin.type = SALE_CONFIG_FIXED_PRICE;
  saleJoin.txn = txn;
  saleJoin.address = event.address;
  saleJoin.save();
}
