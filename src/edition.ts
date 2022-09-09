import {
  EditionInitialized,
  MediaURIsUpdated,
  DescriptionUpdated,
} from "../generated/templates/EditionMetadataRenderer/EditionMetadataRenderer";
import { EditionMetadata, ERC721Drop } from "../generated/schema";
import { Address } from "@graphprotocol/graph-ts";
import {
  ERC721Drop as ERC721DropContract,
} from "../generated/templates/ERC721Drop/ERC721Drop";

export function handleCreatedEdition(event: EditionInitialized): void {
  const targetContract = event.params.target;
  const metadata = new EditionMetadata(targetContract.toHex());

  metadata.description = event.params.description;
  metadata.animationURI = event.params.animationURI;
  metadata.drop = event.params.target.toHex();
  metadata.imageURI = event.params.imageURI;
  metadata.save();
}

export function handleUpdateMediaURIs(event: MediaURIsUpdated): void {
  const metadata = EditionMetadata.load(event.params.target.toHex());
  if (metadata) {
    metadata.animationURI = event.params.animationURI;
    metadata.imageURI = event.params.imageURI;
    metadata.save();
  }
  const drop = ERC721Drop.load(event.params.target.toHex());
  if (drop) {
    // query new contract URI for drop
    const dropContract = ERC721DropContract.bind(
      Address.fromString(event.address.toHex())
    );
    const tryResult = dropContract.try_contractURI();
    if (!tryResult.reverted) {
      drop.contractURI = tryResult.value;
      drop.save();
    }
    drop.save();
  }
}

export function handleUpdateDescription(event: DescriptionUpdated): void {
  const metadata = EditionMetadata.load(event.params.target.toHex());
  if (metadata) {
    metadata.description = event.params.newDescription;
    metadata.save();
  }
  const drop = ERC721Drop.load(event.params.target.toHex());
  if (drop) {
    // query new contract URI for drop
    const dropContract = ERC721DropContract.bind(
      Address.fromString(event.address.toHex())
    );
    const tryResult = dropContract.try_contractURI();
    if (!tryResult.reverted) {
      drop.contractURI = tryResult.value;
      drop.save();
    }
  }
}
