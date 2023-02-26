import { BigInt, ipfs, JSONValue, Value } from "@graphprotocol/graph-ts";
import { MetadataInfo, ZoraCreateContract, ZoraCreateToken, ZoraCreatorPermissions } from "../../../generated/schema";
import {
  AdminChanged,
  ContractRendererUpdated,
  OwnershipTransferred,
  RendererUpdated,
  TransferBatch,
  TransferSingle,
  UpdatedPermissions,
  UpdatedRoyalties,
  UpdatedToken,
  URI,
} from "../../../generated/templates/ZoraCreator1155Impl/ZoraCreator1155Impl";
import { hasBit } from "../../common/hasBit";
import { makeTransaction } from "../../common/makeTransaction";

export function handleContractRendererUpdated(
  event: ContractRendererUpdated
): void {}

function _jsonValueToNullableString(value: JSONValue | null): (string | null) {
  return value !== null ? value.toString() : null;
}

// handle URI json
export function handleURIJSON(value: JSONValue, userData: Value): void {
  const obj = value.toObject();
  let metadataInfo = MetadataInfo.load(userData.toString());
  if (!metadataInfo) {
    metadataInfo = new MetadataInfo(userData.toString());
  }

  metadataInfo.name = _jsonValueToNullableString(obj.get('name'));
  metadataInfo.description = _jsonValueToNullableString(obj.get('description'));
  metadataInfo.image = _jsonValueToNullableString(obj.get('image'));
  metadataInfo.rawJson = value.toString();

  metadataInfo.save();
}

export function handleURI(event: URI): void {
  const id = `${event.address}-${event.params.id}`;
  const token = ZoraCreateToken.load(id);
  if (token) {
    token.uri = event.params.value;
  }
  if (event.params.value.startsWith('ipfs://')) {
    const ipfsPath = event.params.value.replace('ipfs://', '')
    ipfs.mapJSON(ipfsPath, 'handleURIJSON', Value.fromString(id));
  }
}

export function handleUpdatedPermissions(event: UpdatedPermissions): void {
  const id = `${event.params.user}-${event.address}-${event.params.tokenId}`;
  let permissions = ZoraCreatorPermissions.load(id);
  if (!permissions) {
    permissions = new ZoraCreatorPermissions(id);
  }

  permissions.isAdmin = hasBit(1, event.params.permissions);
  permissions.isMinter = hasBit(2, event.params.permissions);
  permissions.isSalesManager = hasBit(3, event.params.permissions);
  permissions.isMetadataManager = hasBit(4, event.params.permissions);
  permissions.isFundsManager = hasBit(5, event.params.permissions);
  permissions.txn = makeTransaction(event);

  permissions.tokenId = event.params.tokenId;
  permissions.contract = event.address.toHexString();

  permissions.save();
}

export function handleUpdatedRoyalties(event: UpdatedRoyalties): void {

}

export function handleUpdatedToken(event: UpdatedToken): void {
  const id = `${event.address}-${event.params.tokenId}`;
  let token = ZoraCreateToken.load(id);
  if (!token) {
    token = new ZoraCreateToken(id);
  }
  token.txn = makeTransaction(event);
  token.contract = event.address.toHex();
  token.tokenId = event.params.tokenId;
  token.uri = event.params.tokenData.uri;
  token.maxSupply = event.params.tokenData.maxSupply;
  token.totalSupply = event.params.tokenData.totalSupply;

  token.save();
}

// update the minted number and mx number
export function handleTransferSingle(event: TransferSingle): void {}

// update the minted number and max number
export function handleTransferBatch(event: TransferBatch): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  const createContract = ZoraCreateContract.load(event.address.toHex());
  if (createContract) {
    createContract.owner = event.params.newOwner;
    createContract.txn = makeTransaction(event);
    createContract.save();
  }
}
