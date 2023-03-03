import {
  SetupNewContract,
  Upgraded,
  ZoraCreator1155FactoryImpl,
} from "../../generated/ZoraNFTCreatorFactory1155/ZoraCreator1155FactoryImpl";

import {
  Upgrade,
  ZoraCreate1155Factory,
  ZoraCreateContract,
} from "../../generated/schema";
import {
  ZoraCreator1155Impl as ZoraCreator1155ImplTemplate,
  MetadataInfo as MetadataInfoTemplate,
  ZoraCreatorFixedPriceSaleStrategy,
  ZoraCreatorMerkleMinterStrategy,
} from "../../generated/templates";
import { makeTransaction } from "../common/makeTransaction";
import { getIPFSHostFromURI } from "../common/getIPFSHostFromURI";
import { BigInt } from "@graphprotocol/graph-ts";

export function handleNewContractCreated(event: SetupNewContract): void {
  const contractId = event.params.newContract.toHex();
  const createdContract = new ZoraCreateContract(contractId);

  createdContract.contractStandard = "ERC1155";
  createdContract.contractURI = event.params.contractURI;
  createdContract.creator = event.params.creator;
  createdContract.initialDefaultAdmin = event.params.defaultAdmin;
  createdContract.owner = event.params.defaultAdmin;
  createdContract.name = event.params.name;
  createdContract.symbol = null;
  createdContract.contractVersion = createdContract.contractVersion;
  createdContract.rendererContract = createdContract.rendererContract;

  // These will get updated when the Upgraded event is captured.
  createdContract.mintFeePerQuantity = BigInt.zero();
  createdContract.mintFeePerTxn = BigInt.zero();
  const ipfsHostPath = getIPFSHostFromURI(event.params.contractURI);
  if (ipfsHostPath !== null) {
    createdContract.metadata = ipfsHostPath;
    MetadataInfoTemplate.create(ipfsHostPath);
  }
  createdContract.txn = makeTransaction(event);
  createdContract.createdAtBlock = event.block.number;

  createdContract.save();
  ZoraCreator1155ImplTemplate.create(event.params.newContract);
}

export function handle1155FactoryUpgraded(event: Upgraded): void {
  const upgrade = new Upgrade(event.transaction.hash.toHex());
  const factory = new ZoraCreate1155Factory(event.address.toHex());
  const creator = ZoraCreator1155FactoryImpl.bind(event.address);

  ZoraCreatorFixedPriceSaleStrategy.create(creator.defaultMinters()[0]);
  ZoraCreatorMerkleMinterStrategy.create(creator.defaultMinters()[1]);

  factory.txn = makeTransaction(event);
  factory.fixedPriceSaleStrategyAddress = creator.defaultMinters()[0];
  factory.implementation = event.params.implementation;
  factory.merkleSaleStrategyAddress = creator.defaultMinters()[1];
  factory.version = creator.contractVersion();

  upgrade.save();
  factory.save();
}
