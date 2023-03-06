import { Address } from "@graphprotocol/graph-ts";

import {
  DropMetadataRenderer as DropMetadataRendererFactory,
  EditionMetadataRenderer as EditionMetadataRendererFactory,
} from "../../generated/templates";

import {
  Upgrade,
  ZoraCreateContract,
  ZoraCreate721Factory,
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
  MetadataInfo as MetadataInfoTemplate,
  NewERC721Drop as NewERC721DropTemplate
} from "../../generated/templates";
import { BigInt } from "@graphprotocol/graph-ts";

export function handleFactoryUpgraded(event: Upgraded): void {
  const upgrade = new Upgrade(event.transaction.hash.toHex());
  const factory = new ZoraCreate721Factory(event.address.toHex());
  const creator = ZoraNFTCreatorV1.bind(event.address);

  DropMetadataRendererFactory.create(creator.dropMetadataRenderer());
  EditionMetadataRendererFactory.create(creator.editionMetadataRenderer());

  factory.txn = makeTransaction(event);
  factory.dropMetadataRendererFactory = creator.dropMetadataRenderer();
  factory.editionMetadataRendererFactory = creator.editionMetadataRenderer();
  factory.implementation = event.params.implementation;
  factory.version = creator.contractVersion().toString();

  upgrade.save();
  factory.save();
}

export function handleCreatedDrop(event: CreatedDrop): void {
  const dropAddress = event.params.editionContractAddress;
  const dropContract = ERC721DropContract.bind(
    Address.fromString(dropAddress.toHex())
  );

  const contractId = event.params.editionContractAddress.toHex();
  const createdContract = new ZoraCreateContract(contractId);

  createdContract.contractStandard = "ERC721";
  const contractURIResponse = dropContract.try_contractURI();
  if (!contractURIResponse.reverted) {
    createdContract.contractURI = contractURIResponse.value;
  }
  createdContract.creator = event.params.creator;
  createdContract.initialDefaultAdmin = dropContract.DEFAULT_ADMIN_ROLE();
  createdContract.owner = dropContract.owner();
  createdContract.name = dropContract.name();
  createdContract.symbol = dropContract.symbol();
  createdContract.contractVersion = dropContract.contractVersion().toString();
  createdContract.rendererContract = dropContract.metadataRenderer();

  createdContract.mintFeePerQuantity = BigInt.zero();
  createdContract.mintFeePerTxn = BigInt.zero();
  if (!contractURIResponse.reverted) {
    const ipfsHostPath = getIPFSHostFromURI(contractURIResponse.value);
    if (ipfsHostPath !== null) {
      createdContract.metadata = ipfsHostPath;
      MetadataInfoTemplate.create(ipfsHostPath);
    }
  }
  createdContract.txn = makeTransaction(event);
  createdContract.createdAtBlock = event.block.number;

  createdContract.save();
  NewERC721DropTemplate.create(event.params.editionContractAddress);
}
