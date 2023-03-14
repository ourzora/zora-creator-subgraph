import { ethereum } from "@graphprotocol/graph-ts";
import { TransactionInfo } from "../../generated/schema";

export function makeTransaction(txn: ethereum.Event): string {
  const txnInfo = new TransactionInfo(txn.transaction.hash.toHex());
  txnInfo.block = txn.block.number;
  txnInfo.timestamp = txn.block.timestamp;
  txnInfo.logIndex = txn.logIndex;
  txnInfo.address = txn.address;
  txnInfo.save();

  return txnInfo.id;
}
