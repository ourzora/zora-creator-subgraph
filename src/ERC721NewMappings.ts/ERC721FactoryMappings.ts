import { Address, dataSource } from "@graphprotocol/graph-ts";

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
  ZoraCreateContract,
} from "../../generated/schema";

import {
  CreatedDrop,
  Upgraded,
  ZoraNFTCreatorV1,
} from "../../generated/ZoraNFTCreatorV1/ZoraNFTCreatorV1";

import { makeTransaction } from "../common/makeTransaction";

import { ERC721Drop as ERC721DropContract } from "../../generated/templates/ERC721Drop/ERC721Drop";
import { getIPFSHostFromURI } from "../common/getIPFSHostFromURI";
import {
  ZoraCreator1155Impl as ZoraCreator1155ImplTemplate,
  MetadataInfo as MetadataInfoTemplate,
} from "../../generated/templates";
import { BigInt } from "@graphprotocol/graph-ts";

export function handleFactoryUpgraded(evt: Upgraded): void {
  const upgrade = new Upgrade(evt.transaction.hash.toHex());

  const creator = ZoraNFTCreatorV1.bind(evt.address);

  DropMetadataRendererFactory.create(creator.dropMetadataRenderer());
  EditionMetadataRendererFactory.create(creator.editionMetadataRenderer());

  upgrade.save();
}

export function handleCreatedDrop(event: CreatedDrop): void {
  const dropContract = ERC721DropContract.bind(
    Address.fromString(event.address.toHex())
  );

  const contractId = event.params.editionContractAddress.toHex();
  const createdContract = new ZoraCreateContract(contractId);

  createdContract.contractStandard = "ERC721";
  createdContract.contractURI = dropContract.contractURI();
  createdContract.creator = event.params.creator;
  createdContract.initialDefaultAdmin = dropContract.DEFAULT_ADMIN_ROLE();
  createdContract.owner = dropContract.owner();
  createdContract.name = dropContract.name();
  createdContract.symbol = dropContract.symbol();
  createdContract.contractVersion = dropContract.contractVersion().toString();
  createdContract.rendererContract = dropContract.metadataRenderer();

  createdContract.mintFeePerQuantity = BigInt.zero();
  createdContract.mintFeePerTxn = BigInt.zero();
  const ipfsHostPath = getIPFSHostFromURI(dropContract.contractURI());
  if (ipfsHostPath !== null) {
    createdContract.metadata = ipfsHostPath;
    MetadataInfoTemplate.create(ipfsHostPath);
  }
  createdContract.txn = makeTransaction(event);
  createdContract.createdAtBlock = event.block.number;

  createdContract.save();
  ZoraCreator1155ImplTemplate.create(event.params.editionContractAddress);
}
