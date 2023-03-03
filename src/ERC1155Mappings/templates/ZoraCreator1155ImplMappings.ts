import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  ZoraCreateContract,
  ZoraCreateToken,
  ZoraCreatorPermissions,
  RoyaltyConfig,
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
  ContractMetadataUpdated,
  SetupNewToken,
  ZoraCreator1155Impl,
} from "../../../generated/templates/ZoraCreator1155Impl/ZoraCreator1155Impl";
import { Upgraded } from "../../../generated/ZoraNFTCreatorFactory1155/ZoraCreator1155FactoryImpl";
import { getIPFSHostFromURI } from "../../common/getIPFSHostFromURI";
import { hasBit } from "../../common/hasBit";
import { makeTransaction } from "../../common/makeTransaction";

export function handleUpgraded(event: Upgraded): void {
  const impl = ZoraCreator1155Impl.bind(event.address);
  if (!impl) {
    return;
  }
  const contract = ZoraCreateContract.load(event.address.toHex());
  if (!contract) {
    return;
  }

  contract.mintFeePerTxn = impl.mintFee();
  contract.mintFeePerQuantity = BigInt.fromString("0");
  contract.contractVersion = impl.contractVersion();
  contract.save();
}

export function handleContractRendererUpdated(
  event: ContractRendererUpdated
): void {
  const token = ZoraCreateContract.load(event.address.toHex());
  if (!token) {
    return;
  }

  token.rendererContract = event.params.renderer;
  token.save();
}

export function handleURI(event: URI): void {
  const id = `${event.address.toHex()}-${event.params.id.toString()}`;
  const token = ZoraCreateToken.load(id);
  if (!token) {
    return;
  }
  const ipfsHostPath = getIPFSHostFromURI(event.params.value);
  if (ipfsHostPath !== null) {
    token.metadata = ipfsHostPath;
    MetadataInfoTemplate.create(ipfsHostPath);
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
  if (event.params.tokenId.equals(BigInt.zero())) {
    permissions.contract = event.address.toHexString();
  } else {
    permissions.tokenAndContract = `${event.address.toHex()}-${event.params.tokenId.toString()}`;
  }

  permissions.save();
}

export function handleUpdatedRoyalties(event: UpdatedRoyalties): void {
  const id = `${event.params.user.toHex()}-${event.params.tokenId.toString()}-${event.address.toHex()}`;
  let royalties = new RoyaltyConfig(id);
  if (!royalties) {
    royalties = new RoyaltyConfig(id);
  }

  royalties.tokenId = event.params.tokenId;
  royalties.user = event.params.user;
  royalties.royaltyBPS = event.params.configuration.royaltyBPS;
  royalties.royaltyRecipient = event.params.configuration.royaltyRecipient;

  if (event.params.tokenId.equals(BigInt.zero())) {
    royalties.contract = event.address.toHexString();
  } else {
    royalties.tokenAndContract = `${event.address.toHex()}-${event.params.tokenId.toString()}`;
  }

  royalties.save();
}

export function handleUpdatedToken(event: UpdatedToken): void {
  const id = `${event.address.toHex()}-${event.params.tokenId.toString()}`;
  let token = ZoraCreateToken.load(id);
  if (!token) {
    token = new ZoraCreateToken(id);
    token.createdAtBlock = event.block.number;
  }
  token.txn = makeTransaction(event);
  token.contract = event.address.toHex();
  token.tokenId = event.params.tokenId;
  token.uri = event.params.tokenData.uri;
  token.maxSupply = event.params.tokenData.maxSupply;
  token.totalMinted = event.params.tokenData.totalMinted;

  token.save();
}

// update the minted number and mx number
export function handleTransferSingle(event: TransferSingle): void {
  if (event.params.from === Address.zero()) {
    const id = `${event.address.toHex()}-${event.params.id.toString()}`;
    const token = ZoraCreateToken.load(id);
    if (token) {
      token.totalSupply = token.totalSupply.plus(event.params.value);
      token.totalMinted = token.totalMinted.plus(event.params.value);
      token.save();
    }
  }
}

// update the minted number and max number
export function handleTransferBatch(event: TransferBatch): void {
  if (event.params.from === Address.zero()) {
    for (let i = 0; i < event.params.ids.length; i++) {
      const id = `${event.address.toHex()}-${event.params.ids[i].toString()}`;
      const token = ZoraCreateToken.load(id);
      if (token) {
        token.totalSupply = token.totalSupply.plus(event.params.values[i]);
        token.totalMinted = token.totalMinted.plus(event.params.values[i]);
        token.save();
      }
    }
  }
  if (event.params.to === Address.zero()) {
    for (let i = 0; i < event.params.ids.length; i++) {
      const id = `${event.address.toHex()}-${event.params.ids[i].toString()}`;
      const token = ZoraCreateToken.load(id);
      if (token) {
        token.totalSupply = token.totalSupply.minus(event.params.values[i]);
        token.save();
      }
    }
  }
}

// Update ownership field when transferred
export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  const createContract = ZoraCreateContract.load(event.address.toHex());
  if (createContract) {
    createContract.owner = event.params.newOwner;
    createContract.txn = makeTransaction(event);
    createContract.save();
  }
}

export function handleContractMetadataUpdated(event: ContractMetadataUpdated): void {
  // pass
}


export function handleSetupNewToken(event: SetupNewToken): void {
  // pass
}