import {
  MetadataUpdated,
  ProvenanceHashUpdated,
} from "../generated/templates/DropMetadataRenderer/DropMetadataRenderer";
import {
  UpdateMediaURIsCall,
  InitializeWithDataCall,
} from "../generated/templates/EditionMetadataRenderer/EditionMetadataRenderer";

export function handleMetadataUpdated(event: MetadataUpdated): void {}

export function handleProvenanceHashUpdated(
  event: ProvenanceHashUpdated
): void {
  console.log("provenence hash for drop updated");
}

export function handleUpdateMediaURIs(call: UpdateMediaURIsCall): void {
  console.log("media uri update call");
}

export function handleInitializeEditionMetadata(
  call: InitializeWithDataCall
): void {
  console.log("initailize metadata call");
}
