import { Address, BigInt } from "@graphprotocol/graph-ts";

export const getTokenId = (contract: Address, tokenId: BigInt) =>
  `${contract.toHexString()}-${tokenId.toString()}`;

export const getDefaultTokenId = (contract: Address) =>
  getTokenId(contract, BigInt.zero());
