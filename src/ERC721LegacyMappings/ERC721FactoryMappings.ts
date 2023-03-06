import { Address, dataSource, BigInt } from "@graphprotocol/graph-ts";

import {
  ERC721Drop as ERC721DropFactory,
  DropMetadataRenderer as DropMetadataRendererFactory,
  EditionMetadataRenderer as EditionMetadataRendererFactory,
} from "../../generated/templates";

import {
  ContractConfig,
  ERC721Drop,
  SalesConfig,
  Upgrade,
} from "../../generated/schema";

import {
  CreatedDrop,
  Upgraded,
  ZoraNFTCreatorV1,
} from "../../generated/ZoraNFTCreatorV1/ZoraNFTCreatorV1";

import { makeTransaction } from "../common/makeTransaction";

import { ERC721Drop as ERC721DropContract } from "../../generated/templates/ERC721Drop/ERC721Drop";


export function handleFactoryUpgraded(evt: Upgraded): void {
  const upgrade = new Upgrade(evt.transaction.hash.toHex());

  const creator = ZoraNFTCreatorV1.bind(evt.address);

  DropMetadataRendererFactory.create(creator.dropMetadataRenderer());
  EditionMetadataRendererFactory.create(creator.editionMetadataRenderer());

  upgrade.save();
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
  drop.version = dropContract.contractVersion();
  drop.created = makeTransaction(event);
  drop.creator = event.transaction.from;
  drop.owner = dropContract.owner();
  drop.txn = makeTransaction(event);

  const salesDetails = dropContract.saleDetails();
  drop.totalMinted = salesDetails.totalMinted;
  drop.maxSupply = salesDetails.maxSupply;

  const uriResult = dropContract.try_contractURI();
  if (!uriResult.reverted) {
    drop.contractURI = uriResult.value;
  }

  const configId = `config-${drop.address.toHex()}`;
  const contractConfig = new ContractConfig(configId);
  contractConfig.drop = dropId;
  const dropConfig = dropContract.config();
  contractConfig.metadataRenderer = dropConfig.getMetadataRenderer();
  contractConfig.editionSize = dropConfig.getEditionSize();
  contractConfig.royaltyBPS = BigInt.fromI32(dropConfig.getRoyaltyBPS());
  contractConfig.fundsRecipient = dropConfig.getFundsRecipient();
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
