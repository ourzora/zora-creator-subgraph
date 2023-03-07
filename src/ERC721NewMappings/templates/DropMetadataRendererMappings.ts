import { MetadataUpdated } from "../../../generated/templates/DropMetadataRenderer/DropMetadataRenderer";
import {
  DropMetadata,
  OnChainMetadataHistory,
} from "../../../generated/schema";
import { getDefaultTokenId } from "../../common/getTokenId";
import { makeTransaction } from "../../common/makeTransaction";

export function handleMetadataUpdated(event: MetadataUpdated): void {
  const metadata = new DropMetadata(event.transaction.hash.toHex());
  metadata.contractURI = event.params.contractURI;
  metadata.extension = event.params.metadataExtension;
  metadata.base = event.params.metadataBase;
  metadata.freezeAt = event.params.freezeAt;
  metadata.save();

  const metadataCompat = new DropMetadata(event.params.target.toHex());
  metadataCompat.contractURI = event.params.contractURI;
  metadataCompat.extension = event.params.metadataExtension;
  metadataCompat.base = event.params.metadataBase;
  metadataCompat.freezeAt = event.params.freezeAt;
  metadataCompat.save();

  const metadataLinkHistorical = new OnChainMetadataHistory(
    event.transaction.hash.toHexString()
  );
  metadataLinkHistorical.createdAtBlock = event.block.number;
  metadataLinkHistorical.dropMetadata = metadata.id;
  metadataLinkHistorical.tokenAndContract = getDefaultTokenId(
    event.params.target
  );
  metadataLinkHistorical.txn = makeTransaction(event);
  metadataLinkHistorical.knownType = "ERC721_DROP";
  metadataLinkHistorical.save();
}
