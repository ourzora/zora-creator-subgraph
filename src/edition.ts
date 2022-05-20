import {
  EditionInitialized,
  MediaURIsUpdated,
  DescriptionUpdated,
} from "../generated/templates/EditionMetadataRenderer/EditionMetadataRenderer";
import { EditionMetadata } from "../generated/schema";

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
}

export function handleUpdateDescription(event: DescriptionUpdated): void {
  const metadata = EditionMetadata.load(event.params.target.toHex());
  if (metadata) {
    metadata.description = event.params.newDescription;
    metadata.save();
  }
}
