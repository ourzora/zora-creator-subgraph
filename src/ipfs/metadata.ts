import { BigInt, Bytes, dataSource, json } from "@graphprotocol/graph-ts";
import { MetadataInfo } from "../../generated/schema";

export function handleJSONMetadataFetched(content: Bytes): void {
  const metadata = new MetadataInfo(dataSource.stringParam());
  metadata.rawJson = content.toString();
  const value = json.fromBytes(content).toObject();
  if (value) {
    if (value.get('name')) {
      metadata.name = value.mustGet('name').toString();
    }
    if (value.get('description')) {
      metadata.description = value.mustGet('description').toString();
    }
    if (value.get('image')) {
      metadata.image = value.mustGet('image').toString();
    }
  }
  metadata.updatedAt = BigInt.fromI64(Date.now()).div(BigInt.fromI32(1000));

  metadata.save();
}