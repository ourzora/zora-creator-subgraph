import { MetadataUpdated } from "../../../generated/templates/DropMetadataRenderer/DropMetadataRenderer";
import {
  DropMetadata,
  OnChainMetadataHistory,
  ZoraCreateContract,
} from "../../../generated/schema";
import { getDefaultTokenId } from "../../common/getTokenId";
import { makeTransaction } from "../../common/makeTransaction";
import { METADATA_ERC721_DROP } from "../../constants/metadataHistoryTypes";

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
  metadataCompat.drop = event.params.target.toHex();
  metadataCompat.freezeAt = event.params.freezeAt;
  metadataCompat.save();

  const metadataLinkHistorical = new OnChainMetadataHistory(
    event.transaction.hash.toHexString()
  );
  metadataLinkHistorical.rendererAddress = event.address;
  metadataLinkHistorical.createdAtBlock = event.block.number;
  metadataLinkHistorical.dropMetadata = metadata.id;
  metadataLinkHistorical.tokenAndContract = getDefaultTokenId(
    event.params.target
  );
  metadataLinkHistorical.txn = makeTransaction(event);
  metadataLinkHistorical.knownType = METADATA_ERC721_DROP;
  metadataLinkHistorical.save();

  // update contract uri
  const contract = ZoraCreateContract.load(event.params.target.toHex());
  if (contract) {
    contract.contractURI = event.params.contractURI;
    contract.save();
  }
}
