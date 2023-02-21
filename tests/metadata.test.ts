import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  afterAll,
  assert,
  clearStore,
  describe,
  newMockEvent,
  test,
} from "matchstick-as/assembly/index";
import { DropMetadata } from "../generated/schema";
import { MetadataUpdated } from "../generated/templates/DropMetadataRenderer/DropMetadataRenderer";
import { handleMetadataUpdated } from "../src/metadata";

describe("metadata", () => {
  afterAll(() => {
    clearStore();
  });
  describe("when entity does not exist", () => {
    test("handle creates new entity", () => {
      const mockEvent = newMockEvent();
      mockEvent.parameters = [
        new ethereum.EventParam(
          "target",
          ethereum.Value.fromAddress(
            Address.fromString("0xabcdefed93200601e1dfe26d6644758801d732e8")
          )
        ),
        new ethereum.EventParam(
          "metadataBase",
          ethereum.Value.fromString("ipfs://bafy/")
        ),
        new ethereum.EventParam(
          "metadataExtension",
          ethereum.Value.fromString(".ipfs")
        ),
        new ethereum.EventParam(
          "contractURI",
          ethereum.Value.fromString("ipfs://bafy/contract.json")
        ),
        new ethereum.EventParam(
          "freezeAt",
          ethereum.Value.fromUnsignedBigInt(BigInt.fromString("2300230"))
        ),
      ];
      handleMetadataUpdated(changetype<MetadataUpdated>(mockEvent));
      const drop = DropMetadata.load(Address.fromString("0xabcdefed93200601e1dfe26d6644758801d732e8").toHex())
      assert.stringEquals("ipfs://bafy/contract.json", drop!.contractURI);
      assert.stringEquals(".ipfs", drop!.extension);
      assert.stringEquals("ipfs://bafy/", drop!.base);
      assert.stringEquals("2300230", drop!.freezeAt.toString());
    });
    test("handles contract update", () => {
      const drop = new DropMetadata(Address.fromString("0xabcdefed93200601e1dfe26d6644758801d732e8").toHex());
      drop.base = "WRONG";
      drop.freezeAt = new BigInt(0);
      drop.save();

      const mockEvent = newMockEvent();
      mockEvent.parameters = [
        new ethereum.EventParam(
          "target",
          ethereum.Value.fromAddress(
            Address.fromString("0xabcdefed93200601e1dfe26d6644758801d732e8")
          )
        ),
        new ethereum.EventParam(
          "metadataBase",
          ethereum.Value.fromString("ipfs://bafy/")
        ),
        new ethereum.EventParam(
          "metadataExtension",
          ethereum.Value.fromString(".ipfs")
        ),
        new ethereum.EventParam(
          "contractURI",
          ethereum.Value.fromString("ipfs://bafy/contract.json")
        ),
        new ethereum.EventParam(
          "freezeAt",
          ethereum.Value.fromUnsignedBigInt(BigInt.fromString("2300230"))
        ),
      ];
      handleMetadataUpdated(changetype<MetadataUpdated>(mockEvent));
      const updatedDrop = DropMetadata.load(Address.fromString("0xabcdefed93200601e1dfe26d6644758801d732e8").toHex())
      assert.stringEquals("ipfs://bafy/contract.json", updatedDrop!.contractURI);
      assert.stringEquals(".ipfs", updatedDrop!.extension);
      assert.stringEquals("ipfs://bafy/", updatedDrop!.base);
      assert.stringEquals("2300230", updatedDrop!.freezeAt.toString());
    });
  });
});
