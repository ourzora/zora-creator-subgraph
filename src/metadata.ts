import { MetadataUpdated } from "../generated/DropMetadataRenderer/DropMetadataRenderer";
import { DropMetadata } from "../generated/schema";

export function handleMetadataUpdated(event: MetadataUpdated): void {
  let metadata = DropMetadata.load(event.params.target.toHex());
  if (!metadata) {
    metadata = new DropMetadata(event.params.target.toHex());
  }
  metadata.contractURI = event.params.contractURI;
  metadata.extension = event.params.metadataExtension;
  metadata.base = event.params.metadataBase;
  metadata.freezeAt = event.params.freezeAt;

  metadata.save();
}
