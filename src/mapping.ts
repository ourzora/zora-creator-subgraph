import {
  CreatedDrop,
  Upgraded,
  ZoraNFTCreatorV1,
} from "../generated/ZoraNFTCreatorV1/ZoraNFTCreatorV1";
import { crypto } from "@graphprotocol/graph-ts";
import {
  ContractConfig,
  ERC721Drop,
  NFTEditionSale,
  NFTEditionTransfer,
  SalesConfig,
  Upgrade,
  TransactionInfo,
  DropRole,
} from "../generated/schema";
import {
  ERC721Drop as ERC721DropFactory,
  DropMetadataRenderer as DropMetadataRendererFactory,
  EditionMetadataRenderer as EditionMetadataRendererFactory,
} from "../generated/templates";
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
} from "../generated/templates/ERC721Drop/ERC721Drop";
import { Address, Bytes, dataSource, ethereum } from "@graphprotocol/graph-ts";

function makeTransaction(txn: ethereum.Event): string {
  const txnInfo = new TransactionInfo(txn.transaction.hash.toHex());
  txnInfo.block = txn.block.number;
  txnInfo.timestamp = txn.block.timestamp;
  txnInfo.save();

  return txnInfo.id;
}

export function handleOwnershipTransferred(evt: OwnershipTransferred): void {
  const drop = ERC721Drop.load(evt.address.toHex());
  if (drop) {
    drop.owner = evt.params.newOwner;
    drop.save();
  }
}

const KNOWN_TYPE_DEFAULT_ADMIN: string =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const KNOWN_TYPE_MINTER_ROLE: string =
  "0xf0887ba65ee2024ea881d91b74c2450ef19e1557f03bed3ea9f16b037cbe2dc9";

const KNOWN_TYPE_SALES_MANAGER_ROLE: string =
  "0x5ebbf78043a2215b522b1366a193ec74dd1f54e441e841a87b9653246a9c49a6";

function lookupRole(role: string): string {
  if (role.startsWith(KNOWN_TYPE_DEFAULT_ADMIN)) {
    return "DEFAULT_ADMIN";
  }
  if (role.startsWith(KNOWN_TYPE_MINTER_ROLE)) {
    return "MINTER";
  }
  if (role.startsWith(KNOWN_TYPE_SALES_MANAGER_ROLE)) {
    return "SALES_MANAGER";
  }

  return '';
}

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

export function handleFactoryUpgraded(evt: Upgraded): void {
  const upgrade = new Upgrade(evt.transaction.hash.toHex());

  const creator = ZoraNFTCreatorV1.bind(evt.address);

  DropMetadataRendererFactory.create(creator.dropMetadataRenderer());
  EditionMetadataRendererFactory.create(creator.editionMetadataRenderer());

  upgrade.save();
}

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

export function handleCreatedDrop(event: CreatedDrop): void {
  const dropId = event.params.editionContractAddress.toHex();
  const drop = new ERC721Drop(dropId);
  drop.address = event.params.editionContractAddress;
  drop.createdAt = event.block.timestamp;

  const dropContract = ERC721DropContract.bind(
    Address.fromString(drop.address.toHex())
  );

  const rendererAddress = dropContract.metadataRenderer();
  drop.rendererAddress = rendererAddress;

  drop.name = dropContract.name();
  drop.symbol = dropContract.symbol();
  drop.network = dataSource.network();

  drop.save();

  drop.created = makeTransaction(event);
  drop.creator = event.transaction.from;
  drop.txn = makeTransaction(event);
  const salesDetails = dropContract.saleDetails();
  drop.totalMinted = salesDetails.totalMinted;
  drop.maxSupply = salesDetails.maxSupply;

  drop.created = makeTransaction(event);
  drop.creator = event.transaction.from;
  drop.owner = dropContract.owner();

  const configId = `config-${drop.address.toHex()}`;
  const contractConfig = new ContractConfig(configId);
  contractConfig.drop = dropId;
  const dropConfig = dropContract.config();
  contractConfig.metadataRenderer = dropConfig.value0;
  contractConfig.editionSize = dropConfig.value1;
  contractConfig.royaltyBPS = dropConfig.value2;
  contractConfig.fundsRecipient = dropConfig.value3;
  contractConfig.save();

  const salesConfigId = event.transaction.hash.toHex();
  const salesConfig = new SalesConfig(salesConfigId);
  salesConfig.drop = dropId;
  const salesConfigDrop = dropContract.salesConfig();

  /**
   * uint104 publicSalePrice;
     uint32 maxSalePurchasePerAddress;
     uint64 publicSaleStart;
     uint64 publicSaleEnd;
     uint64 presaleStart;
     uint64 presaleEnd;
     bytes32 presaleMerkleRoot;
   */
  salesConfig.publicSalePrice = salesConfigDrop.value0;
  salesConfig.maxSalePurchasePerAddress = salesConfigDrop.value1;
  salesConfig.publicSaleStart = salesConfigDrop.value2;
  salesConfig.publicSaleEnd = salesConfigDrop.value3;
  salesConfig.presaleStart = salesConfigDrop.value4;
  salesConfig.presaleEnd = salesConfigDrop.value5;
  salesConfig.presaleMerkleRoot = salesConfigDrop.value6;
  salesConfig.save();

  drop.salesConfig = salesConfigId;
  drop.contractConfig = configId;

  drop.save();

  ERC721DropFactory.create(event.params.editionContractAddress);
}

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

export function handleOpenMintFinalized(event: OpenMintFinalized): void {
  const config = ContractConfig.load(event.address.toHex());

  if (config) {
    config.editionSize = event.params.numberOfMints;
    config.save();
  }
}

export function handleFundsRecipientChanged(
  event: FundsRecipientChanged
): void {
  const config = ContractConfig.load(event.address.toHex());

  if (config) {
    config.fundsRecipient = event.params.newAddress;
    config.save();
  }
}

export function handleNFTTransfer(event: Transfer): void {
  updateDropSupply(event.address);

  const transfer = new NFTEditionTransfer(event.transaction.hash.toHex());
  transfer.to = event.params.to;
  transfer.from = event.params.from;
  transfer.txn = makeTransaction(event);
  transfer.tokenId = event.params.tokenId;
  transfer.drop = event.address.toHex();
  transfer.mintedAt = event.block.timestamp;

  transfer.save();
}

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

  sale.save();
}
