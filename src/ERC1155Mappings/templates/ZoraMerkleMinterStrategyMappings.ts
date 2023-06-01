import { BigInt } from "@graphprotocol/graph-ts";
import {
  SalesConfigMerkleMinterStrategy,
  SalesStrategyConfig,
} from "../../../generated/schema";
import { SaleSet } from "../../../generated/templates/ZoraCreatorMerkleMinterStrategy/ZoraCreatorMerkleMinterStrategy";
import { getSalesConfigKey } from "../../common/getSalesConfigKey";
import { getTokenId } from "../../common/getTokenId";
import { makeTransaction } from "../../common/makeTransaction";
import { SALE_CONFIG_PRESALE } from "../../constants/salesConfigTypes";

export function handleMerkleMinterStrategySaleSet(event: SaleSet): void {
  const id = getSalesConfigKey(event.address, event.params.mediaContract, event.params.tokenId)
  let sale = new SalesConfigMerkleMinterStrategy(id);
  sale.configAddress = event.address;
  sale.presaleStart = event.params.merkleSaleSettings.presaleStart;
  sale.presaleEnd = event.params.merkleSaleSettings.presaleEnd;
  sale.fundsRecipient = event.params.merkleSaleSettings.fundsRecipient;
  sale.merkleRoot = event.params.merkleSaleSettings.merkleRoot;
  const txn = makeTransaction(event);
  sale.txn = txn;
  sale.tokenId = event.params.tokenId
  sale.contract = event.params.mediaContract.toHex()

  sale.save();

  // add join
  const saleJoin = new SalesStrategyConfig(id);
  if (event.params.tokenId.equals(BigInt.zero())) {
    saleJoin.contract = event.params.mediaContract.toHex();
  } else {
    saleJoin.tokenAndContract = getTokenId(event.params.mediaContract, event.params.tokenId);
  }
  saleJoin.presale = id;
  saleJoin.type = SALE_CONFIG_PRESALE;
  saleJoin.txn = txn;
  saleJoin.save();
}
