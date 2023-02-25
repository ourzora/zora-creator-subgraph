import { Address } from "@graphprotocol/graph-ts";
import { makeTransaction } from "../../common/makeTransaction";

import {
  ContractConfig,
  ERC721Drop,
  NFTEditionSale,
  SalesConfig,
  DropRole,
} from "../../../generated/schema";

import {
  ERC721Drop as ERC721DropContract,
  FundsRecipientChanged,
  OpenMintFinalized,
  OwnershipTransferred,
  RoleGranted,
  RoleRevoked,
  Sale,
  SalesConfigChanged,
  Transfer,
  Upgraded
} from "../../../generated/templates/ERC721Drop/ERC721Drop";

import { lookupRole } from "../utils/roleUtils";


/* sales config updated */

export function handleSalesConfigChanged(event: SalesConfigChanged): void {
  const dropId = event.address.toHex();
  const drop = ERC721Drop.load(dropId);
  const dropContract = ERC721DropContract.bind(
    Address.fromString(event.address.toHex())
  );

  const newSalesConfigId = event.transaction.hash.toHex();
  const newSalesConfig = new SalesConfig(newSalesConfigId);
  const salesConfigObject = dropContract.salesConfig();

  // type mapping:
  // uint104:publicSalePrice,uint32:maxSalePurchasePerAddress
  // uint64:publicSaleStart,uint64:publicSaleEnd,uint64:presaleStart,uint64:presaleEnd
  // bytes32:presaleMerkleRoot
  newSalesConfig.drop = dropId;
  newSalesConfig.publicSalePrice = salesConfigObject.value0;
  newSalesConfig.maxSalePurchasePerAddress = salesConfigObject.value1;
  newSalesConfig.publicSaleStart = salesConfigObject.value2;
  newSalesConfig.publicSaleEnd = salesConfigObject.value3;
  newSalesConfig.presaleStart = salesConfigObject.value4;
  newSalesConfig.presaleEnd = salesConfigObject.value5;
  newSalesConfig.presaleMerkleRoot = salesConfigObject.value6;
  newSalesConfig.save();

  if (drop) {
    drop.salesConfig = newSalesConfigId;
    drop.save();
  }
}

/* handle upgraded – updates contract version */

export function handleUpgraded(evt: Upgraded): void {
  const drop = ERC721DropContract.bind(Address.fromBytes(evt.address));
  if (drop) {
    const version = drop.contractVersion()
    const savedDrop = ERC721Drop.load(evt.address.toHex());
    if (savedDrop) {
      savedDrop.version = version;
      savedDrop.save();
    }
  }
}


/* role mappings */


export function handleRoleGranted(evt: RoleGranted): void {
  const roleHexString: string = evt.params.role.toHexString();

  const savedRole = new DropRole(
    `${evt.address.toHexString()}-${evt.params.account.toHexString()}-${roleHexString}`
  );
  savedRole.roleHash = evt.params.role;
  savedRole.role = lookupRole(roleHexString);
  savedRole.account = evt.params.account;
  savedRole.sender = evt.params.sender;
  savedRole.updated = evt.block.timestamp;
  savedRole.granted = true;
  savedRole.drop = evt.address.toHexString();
  savedRole.save();
}

export function handleRoleRevoked(evt: RoleRevoked): void {
  const roleHexString: string = evt.params.role.toHexString();

  const savedRole = DropRole.load(
    `${evt.address.toHexString()}-${evt.params.account.toHexString()}-${roleHexString}`
  );
  if (savedRole) {
    savedRole.roleHash = evt.params.role;
    savedRole.role = lookupRole(roleHexString);
    savedRole.account = evt.params.account;
    savedRole.sender = evt.params.sender;
    savedRole.updated = evt.block.timestamp;
    savedRole.granted = false;
    savedRole.save();
  }
}

/* finalized */

export function handleOpenMintFinalized(event: OpenMintFinalized): void {
  const config = ContractConfig.load(event.address.toHex());

  if (config) {
    config.editionSize = event.params.numberOfMints;
    config.save();
  }
}

/* funds recipient changed */

export function handleFundsRecipientChanged(
  event: FundsRecipientChanged
): void {
  const config = ContractConfig.load(event.address.toHex());

  if (config) {
    config.fundsRecipient = event.params.newAddress;
    config.save();
  }
}

/* NFT transfer event */

export function handleNFTTransfer(event: Transfer): void {
  updateDropSupply(event.address);

  // maybe add back in? but makes queries slower
  // const transfer = new NFTEditionTransfer(event.transaction.hash.toHex());
  // transfer.to = event.params.to;
  // transfer.from = event.params.from;
  // transfer.txn = makeTransaction(event);
  // transfer.tokenId = event.params.tokenId;
  // transfer.drop = event.address.toHex();
  // transfer.mintedAt = event.block.timestamp;

  // transfer.save();
}

/* sale completed event */

export function handleSale(event: Sale): void {
  updateDropSupply(event.address);

  const sale = new NFTEditionSale(event.transaction.hash.toHex());
  sale.pricePerToken = event.params.pricePerToken;
  sale.priceTotal = event.transaction.value;
  sale.purchaser = event.transaction.from;
  sale.txn = makeTransaction(event);
  sale.firstPurchasedTokenId = event.params.firstPurchasedTokenId.toI32();
  sale.count = event.params.quantity;
  sale.drop = event.address.toHex();
  sale.mintedAt = event.block.timestamp;

  sale.save();
}

/* helper to update drop supply */

function updateDropSupply(dropAddress: Address): void {
  const dropContract = ERC721DropContract.bind(dropAddress);
  const saleDetails = dropContract.saleDetails();
  const drop = ERC721Drop.load(dropAddress.toHex());

  if (drop) {
    // Update the total minted counter
    drop.totalMinted = saleDetails.totalMinted;
    drop.maxSupply = saleDetails.maxSupply;
    drop.save();
  }
}

/* handle ownership transfer */

export function handleOwnershipTransferred(evt: OwnershipTransferred): void {
  const drop = ERC721Drop.load(evt.address.toHex());
  if (drop) {
    drop.owner = evt.params.newOwner;
    drop.save();
  }
}
