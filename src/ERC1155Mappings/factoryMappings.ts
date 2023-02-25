import {
  SetupNewContract,
  Upgraded,
} from "../../generated/ZoraNFTCreatorFactory1155/ZoraCreator1155FactoryImpl";

import { Upgrade, ZoraCreateContract } from "../../generated/schema";
import { ZoraCreator1155Impl } from "../../generated/templates";

export function handleNewContractCreated(event: SetupNewContract): void {
  const contractId = event.params.newContract.toHex();
  const createdContract = new ZoraCreateContract(contractId);

  createdContract.contractStandard = "ERC1155";
  createdContract.contractURI = event.params.contractURI;
  createdContract.creator = event.params.creator.toHex();
  createdContract.defaultAdmin = event.params.defaultAdmin.toHex();
  createdContract.name = null;
  createdContract.symbol = null;
  createdContract.metadata = null;

  createdContract.save();
  ZoraCreator1155Impl.create(event.params.newContract);
}

export function handle1155FactoryUpgraded(event: Upgraded): void {}
//  const upgrade = new Upgrade(evt.transaction.hash.toHex());

//  const creator = ZoraNFTCreatorV1.bind(evt.address);

//  DropMetadataRendererFactory.create(creator.dropMetadataRenderer());
//  EditionMetadataRendererFactory.create(creator.editionMetadataRenderer());

//  upgrade.save();
// const upgrade = new Upgrade(event.transaction.hash.toHex());

// //const contract = new event.address();

// do the create for the sales confisgs
// .create means listen for that new address

// upgrade.save();
