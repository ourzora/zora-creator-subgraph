import { Address } from "@graphprotocol/graph-ts";

import {
  DropMetadataRenderer as DropMetadataRendererFactory,
  EditionMetadataRenderer as EditionMetadataRendererFactory,
} from "../../generated/templates";

import {
  Upgrade,
  ZoraCreateContract,
  ZoraCreate721Factory,
  ZoraCreateToken,
  RoyaltyConfig,
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
  NewERC721Drop as NewERC721DropTemplate,
} from "../../generated/templates";
import { BigInt } from "@graphprotocol/graph-ts";
import { getDefaultTokenId } from "../common/getTokenId";

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
  const dropContract = ERC721DropContract.bind(dropAddress);

  const contractId = event.params.editionContractAddress.toHex();
  const createdContract = new ZoraCreateContract(contractId);

  createdContract.address = dropAddress;
  createdContract.contractVersion = dropContract.contractVersion().toString();
  const dropConfig = dropContract.config();

  // setup royalties
  const royalties = new RoyaltyConfig(dropAddress.toHex());
  royalties.royaltyRecipient = dropConfig.getFundsRecipient();
  royalties.royaltyMintSchedule = BigInt.zero();
  royalties.contract = createdContract.id;
  royalties.tokenId = BigInt.zero();
  royalties.royaltyBPS = BigInt.fromU64(dropConfig.getRoyaltyBPS());
  royalties.user = event.params.creator;
  royalties.save();

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

  const feePerAmount = dropContract.try_zoraFeeForAmount(BigInt.fromI64(1));
  if (feePerAmount.reverted) {
    createdContract.mintFeePerQuantity = BigInt.zero();
  }
  createdContract.mintFeePerQuantity = feePerAmount.value.getFee();
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

  // create token from contract
  const createTokenId = getDefaultTokenId(dropAddress);
  const newToken = new ZoraCreateToken(createTokenId);
  newToken.address = dropAddress;
  newToken.rendererContract = createdContract.rendererContract;
  newToken.totalSupply = BigInt.zero();
  newToken.maxSupply = event.params.editionSize;
  newToken.totalMinted = BigInt.zero();
  newToken.contract = contractId;
  newToken.tokenId = BigInt.zero();
  newToken.txn = makeTransaction(event);
  newToken.createdAtBlock = event.block.number;
  newToken.tokenStandard = "ERC721";
  newToken.save();

  NewERC721DropTemplate.create(dropAddress);
}
