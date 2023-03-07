import {
  EditionInitialized,
  MediaURIsUpdated,
  DescriptionUpdated,
} from "../../../generated/templates/EditionMetadataRenderer/EditionMetadataRenderer";
import { EditionMetadata, OnChainMetadata, ZoraCreateToken } from "../../../generated/schema";
import { getDefaultTokenId } from "../../common/getTokenId";
import { makeTransaction } from "../../common/makeTransaction";

export function handleCreatedEdition(event: EditionInitialized): void {
  const metadata = new EditionMetadata(event.params.target.toHexString());

  metadata.animationURI = event.params.animationURI;
  metadata.description = event.params.description;
  metadata.drop = event.params.target.toHex();
  metadata.imageURI = event.params.imageURI;
  metadata.save();

  const metadataHistory = new EditionMetadata(event.transaction.hash.toHexString());
  metadataHistory.animationURI = event.params.animationURI;
  metadataHistory.description = event.params.description;
  metadataHistory.drop = event.params.target.toHexString();
  metadataHistory.imageURI = event.params.imageURI;
  metadataHistory.save();

  const metadataLinkHistory = new OnChainMetadata(event.transaction.hash.toHexString());
  metadataLinkHistory.createdAtBlock = event.block.number;
  metadataLinkHistory.editionMetadata = metadataHistory.id;
  metadataLinkHistory.tokenAndContract = getDefaultTokenId(event.params.target);
  metadataLinkHistory.txn = makeTransaction(event);
  metadataLinkHistory.knownType = "ERC721_EDITION";
  metadataLinkHistory.save();

  const metadataLink = new OnChainMetadata(event.params.target.toHexString());
  metadataLink.createdAtBlock = event.block.number;
  metadataLink.editionMetadata = metadata.id;
  metadataLink.tokenAndContract = getDefaultTokenId(event.params.target);
  metadataLink.txn = makeTransaction(event);
  metadataLink.knownType = "ERC721_EDITION";
  metadataLink.save();

  const currentToken = ZoraCreateToken.load(metadataLink.tokenAndContract);
  if (currentToken) {
    currentToken.onChainMetadata = metadataLink.id;
    currentToken.save();
  }
}

export function handleUpdateMediaURIs(event: MediaURIsUpdated): void {
  const lastMetadata = EditionMetadata.load(event.params.target.toHexString());

  if (!lastMetadata) {
    return;
  }

  lastMetadata.animationURI = event.params.animationURI;
  lastMetadata.drop = event.params.target.toHex();
  lastMetadata.imageURI = event.params.imageURI;
  lastMetadata.save();

  const metadataHistory = new EditionMetadata(event.transaction.hash.toHexString());
  metadataHistory.animationURI = event.params.animationURI;
  metadataHistory.description = lastMetadata.description;
  metadataHistory.drop = event.params.target.toHexString();
  metadataHistory.imageURI = event.params.imageURI;
  metadataHistory.save();

  const metadataPin = new EditionMetadata(event.params.target.toHexString());
  metadataPin.animationURI = event.params.animationURI;
  metadataPin.description = lastMetadata.description;
  metadataPin.drop = event.params.target.toHexString();
  metadataPin.imageURI = event.params.imageURI;
  metadataPin.save();

  const metadataLinkHistory = new OnChainMetadata(event.transaction.hash.toHexString());
  metadataLinkHistory.createdAtBlock = event.block.number;
  metadataLinkHistory.editionMetadata = metadataHistory.id;
  metadataLinkHistory.tokenAndContract = getDefaultTokenId(event.params.target);
  metadataLinkHistory.txn = makeTransaction(event);
  metadataLinkHistory.knownType = "ERC721_EDITION";
  metadataLinkHistory.save();

  const metadataLink = new OnChainMetadata(event.params.target.toHexString());
  metadataLink.createdAtBlock = event.block.number;
  metadataLink.editionMetadata = metadataPin.id;
  metadataLink.tokenAndContract = getDefaultTokenId(event.params.target);
  metadataLink.txn = makeTransaction(event);
  metadataLink.knownType = "ERC721_EDITION";
  metadataLink.save();

  const currentToken = ZoraCreateToken.load(metadataLink.tokenAndContract);
  if (currentToken) {
    currentToken.onChainMetadata = metadataLink.id;
    currentToken.save();
  }
}

export function handleUpdateDescription(event: DescriptionUpdated): void {
  const lastMetadata = EditionMetadata.load(event.params.target.toHexString());

  if (!lastMetadata) {
    return;
  }

  lastMetadata.description = event.params.newDescription;
  lastMetadata.save();

  const metadataHistory = new EditionMetadata(event.transaction.hash.toHexString());
  metadataHistory.animationURI = lastMetadata.animationURI;
  metadataHistory.description = event.params.newDescription;
  metadataHistory.drop = event.params.target.toHexString();
  metadataHistory.imageURI = lastMetadata.imageURI;
  metadataHistory.save();

  const metadataLinkHistory = new OnChainMetadata(event.transaction.hash.toHexString());
  metadataLinkHistory.createdAtBlock = event.block.number;
  metadataLinkHistory.editionMetadata = metadataHistory.id;
  metadataLinkHistory.tokenAndContract = getDefaultTokenId(event.params.target);
  metadataLinkHistory.txn = makeTransaction(event);
  metadataLinkHistory.knownType = "ERC721_EDITION";
  metadataLinkHistory.save();

  const metadataLink = new OnChainMetadata(event.params.target.toHexString());
  metadataLink.createdAtBlock = event.block.number;
  metadataLink.editionMetadata = metadataHistory.id;
  metadataLink.tokenAndContract = getDefaultTokenId(event.params.target);
  metadataLink.txn = makeTransaction(event);
  metadataLink.knownType = "ERC721_EDITION";
  metadataLink.save();

  const currentToken = ZoraCreateToken.load(metadataLink.tokenAndContract);
  if (currentToken) {
    currentToken.onChainMetadata = metadataLink.id;
    currentToken.save();
  }
}
