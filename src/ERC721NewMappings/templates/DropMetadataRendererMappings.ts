import { MetadataUpdated } from "../../../generated/templates/DropMetadataRenderer/DropMetadataRenderer";
import { DropMetadata, OnChainMetadata, ZoraCreateToken } from "../../../generated/schema";
import { getDefaultTokenId } from "../../common/getTokenId";
import { makeTransaction } from "../../common/makeTransaction";

export function handleMetadataUpdated(event: MetadataUpdated): void {
  const metadata = new DropMetadata(event.transaction.hash.toHex());
  metadata.contractURI = event.params.contractURI;
  metadata.extension = event.params.metadataExtension;
  metadata.base = event.params.metadataBase;
  metadata.freezeAt = event.params.freezeAt;
  metadata.drop = event.params.target.toHexString();
  metadata.save();

  const metadataLinkHistorical = new OnChainMetadata(event.transaction.hash.toHexString());
  metadataLinkHistorical.createdAtBlock = event.block.number;
  metadataLinkHistorical.dropMetadata = metadata.id;
  metadataLinkHistorical.tokenAndContract = getDefaultTokenId(event.params.target);
  metadataLinkHistorical.txn = makeTransaction(event);
  metadataLinkHistorical.knownType = "ERC721_DROP";
  metadataLinkHistorical.save();

  const metadataLink = new OnChainMetadata(event.params.target.toHexString());
  metadataLink.createdAtBlock = event.block.number;
  metadataLink.dropMetadata = metadata.id;
  metadataLink.tokenAndContract = getDefaultTokenId(event.params.target);
  metadataLink.txn = makeTransaction(event);
  metadataLink.knownType = "ERC721_DROP";
  metadataLink.save();

  const currentToken = ZoraCreateToken.load(metadataLink.tokenAndContract);
  if (currentToken) {
    currentToken.onChainMetadata = metadataLink.id;
    currentToken.save();
  }
}
