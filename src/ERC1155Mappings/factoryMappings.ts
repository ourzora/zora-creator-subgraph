import {
  SetupNewContract,
  Upgraded,
  ZoraCreator1155FactoryImpl,
} from "../../generated/ZoraNFTCreatorFactory1155/ZoraCreator1155FactoryImpl";

import { ZoraCreateContract } from "../../generated/schema";

export function handleNewContractCreated(event: SetupNewContract): void {
  const contractId = event.params.newContract.toHex();
  const createdContract = new ZoraCreateContract(contractId);

  createdContract.contractStandard = "ERC1155";
  createdContract.contractURI = event.params.contractURI;

  //    id: ID!;
  //    name: String!;
  //    symbol: String;
  //    contractURI: String!;
  //    profileImage: String!;
  //    contractStandard: String!;
  //    metadata: MetadataInfo;
}

export function handle1155FactoryUpgraded(event: Upgraded): void {}