import {
  ZoraCreateContract,
  ZoraCreateToken,
  ZoraCreatorPermissions,
} from "../../../generated/schema";
import { MetadataInfo as MetadataInfoTemplate } from "../../../generated/templates";
import {
  ContractRendererUpdated,
  OwnershipTransferred,
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

export function handleURI(event: URI): void {
  const id = `${event.address.toHex()}-${event.params.id.toString()}`;
  const token = ZoraCreateToken.load(id);
  if (!token) {
    return;
  }
  if (event.params.value.startsWith("ipfs://")) {
    const ipfsPath = event.params.value.replace("ipfs://", "");
    token.metadata = ipfsPath;
    MetadataInfoTemplate.create(ipfsPath);
  }
  token.uri = event.params.value;
  token.save();
}

export function handleUpdatedPermissions(event: UpdatedPermissions): void {
  const id = `${event.params.user.toHex()}-${event.address.toHex()}-${event.params.tokenId.toString()}`;
  let permissions = ZoraCreatorPermissions.load(id);
  if (!permissions) {
    permissions = new ZoraCreatorPermissions(id);
  }

  permissions.isAdmin = hasBit(1, event.params.permissions);
  permissions.isMinter = hasBit(2, event.params.permissions);
  permissions.isSalesManager = hasBit(3, event.params.permissions);
  permissions.isMetadataManager = hasBit(4, event.params.permissions);
  permissions.isFundsManager = hasBit(5, event.params.permissions);
  permissions.user = event.params.user;
  permissions.txn = makeTransaction(event);

  permissions.tokenId = event.params.tokenId;
  permissions.contract = event.address.toHexString();

  permissions.save();
}

export function handleUpdatedRoyalties(event: UpdatedRoyalties): void {}

export function handleUpdatedToken(event: UpdatedToken): void {
  const id = `${event.address.toHex()}-${event.params.tokenId.toString()}`;
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
