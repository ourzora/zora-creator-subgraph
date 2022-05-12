import {
  EditionInitialized,
  MediaURIsUpdated,
} from "../generated/EditionMetadataRenderer/EditionMetadataRenderer";
import { EditionMetadata } from "../generated/schema";

export function handleCreatedEdition(event: EditionInitialized): void {
  const targetContract = event.params.target;
  const metadata = new EditionMetadata(targetContract.toHex());
  
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
