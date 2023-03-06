import { Address, BigInt } from "@graphprotocol/graph-ts";

export const getSalesConfigOnLegacyMarket = (
  marketAddress: Address,
  postfix: string
) =>
  `${getSalesConfigKey(
    marketAddress,
    marketAddress,
    BigInt.zero() 
  )}-${postfix}`;

export const getSalesConfigKey = (
  marketAddress: Address,
  mediaContractAddress: Address,
  tokenId: BigInt
) =>
  [
    marketAddress.toHexString(),
    mediaContractAddress.toHexString(),
    tokenId.toString(),
  ].join("-");
