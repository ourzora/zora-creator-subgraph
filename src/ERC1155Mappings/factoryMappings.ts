import {
  SetupNewContract,
  Upgraded,
} from "../../generated/ZoraNFTCreatorFactory1155/ZoraCreator1155FactoryImpl";

import { ZoraCreateContract } from "../../generated/schema";
import { ZoraCreator1155Impl as ZoraCreator1155ImplTemplate, MetadataInfo as MetadataInfoTemplate } from "../../generated/templates";
import { makeTransaction } from "../common/makeTransaction";
import { getIPFSHostFromURI } from "../common/getIPFSHostFromURI";

export function handleNewContractCreated(event: SetupNewContract): void {
  const contractId = event.params.newContract.toHex();
  const createdContract = new ZoraCreateContract(contractId);

  createdContract.contractStandard = "ERC1155";
  createdContract.contractURI = event.params.contractURI;
  createdContract.creator = event.params.creator;
  createdContract.initialDefaultAdmin = event.params.defaultAdmin;
  createdContract.owner = event.params.defaultAdmin;
  createdContract.name = null;
  createdContract.symbol = null;
  const ipfsHostPath = getIPFSHostFromURI(event.params.contractURI);
  if (ipfsHostPath !== null) {
    createdContract.metadata = ipfsHostPath;
    MetadataInfoTemplate.create(ipfsHostPath);
  }
  createdContract.txn = makeTransaction(event);

  createdContract.save();
  ZoraCreator1155ImplTemplate.create(event.params.newContract);
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
// }