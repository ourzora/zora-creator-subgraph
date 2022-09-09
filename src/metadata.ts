import { MetadataUpdated } from "../generated/templates/DropMetadataRenderer/DropMetadataRenderer";
import { DropMetadata, ERC721Drop } from "../generated/schema";
import {
  ERC721Drop as ERC721DropContract,
} from "../generated/templates/ERC721Drop/ERC721Drop";
import { Address } from "@graphprotocol/graph-ts";


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

  const drop = ERC721Drop.load(event.params.target.toHex());
  if (drop) {
    // query new contract URI for drop
    const dropContract = ERC721DropContract.bind(
      Address.fromString(event.params.target.toHex())
    );
    const tryResult = dropContract.try_contractURI();
    if (!tryResult.reverted) {
      drop.contractURI = tryResult.value;
      drop.save();
    }
  }
}
