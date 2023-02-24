import {
  SetupNewContract,
  Upgraded,
} from "../../generated/ZoraNFTCreatorFactory1155/ZoraCreator1155FactoryImpl";

import { Upgrade, ZoraCreateContract } from "../../generated/schema";

export function handleNewContractCreated(event: SetupNewContract): void {
  const contractId = event.params.newContract.toHex();
  const createdContract = new ZoraCreateContract(contractId);

  createdContract.contractStandard = "ERC1155";
  createdContract.contractURI = event.params.contractURI;

  createdContract.name = null;
  createdContract.symbol = null;
  createdContract.metadata = null;

  createdContract.save();
}

export function handle1155FactoryUpgraded(event: Upgraded): void {
  //  const upgrade = new Upgrade(evt.transaction.hash.toHex());

  //  const creator = ZoraNFTCreatorV1.bind(evt.address);

  //  DropMetadataRendererFactory.create(creator.dropMetadataRenderer());
  //  EditionMetadataRendererFactory.create(creator.editionMetadataRenderer());

  //  upgrade.save();
  // const upgrade = new Upgrade(event.transaction.hash.toHex());
  // //const contract = new event.address();

  // upgrade.save();
}
