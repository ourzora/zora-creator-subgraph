import { Address, BigInt } from "@graphprotocol/graph-ts";

export const getPermissionsKey = (
  user: Address,
  address: Address,
  tokenId: BigInt
) => `${user.toHex()}-${address.toHex()}-${tokenId.toString()}`;
