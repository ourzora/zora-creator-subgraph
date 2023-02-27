import { BigInt } from "@graphprotocol/graph-ts";
import {
  ERC1155SalesConfigMerkleMinterStrategy,
  ERC1155SalesStrategyConfig,
} from "../../../generated/schema";
import { SaleSet } from "../../../generated/templates/ZoraCreatorMerkleMinterStrategy/ZoraCreatorMerkleMinterStrategy";
import { makeTransaction } from "../../common/makeTransaction";

export function handleMerkleMinterStrategySaleSet(event: SaleSet): void {
  const id = `${event.address.toHex()}-${event.params.sender.toHex()}-${event.params.tokenId.toString()}`;
  let sale = new ERC1155SalesConfigMerkleMinterStrategy(id);
  sale.presaleStart = event.params.merkleSaleSettings.presaleStart;
  sale.presaleEnd = event.params.merkleSaleSettings.presaleEnd;
  sale.fundsRecipient = event.params.merkleSaleSettings.fundsRecipient;
  sale.merkleRoot = event.params.merkleSaleSettings.merkleRoot;
  const txn = makeTransaction(event);
  sale.txn = txn;

  sale.save();

  // add join
  const saleJoin = new ERC1155SalesStrategyConfig(id);
  if (event.params.tokenId.equals(BigInt.zero())) {
    saleJoin.contract = event.params.sender.toHex();
  } else {
    saleJoin.tokenAndContract = `${event.params.sender.toHex()}-${event.params.tokenId.toString()}`;
  }
  saleJoin.presale = id;
  saleJoin.type = "presale";
  saleJoin.txn = txn;
  saleJoin.save();
}
