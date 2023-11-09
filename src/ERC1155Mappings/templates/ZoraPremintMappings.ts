import { Premint } from "../../../generated/schema";
import { Preminted } from "../../../generated/templates/ZoraCreator1155PremintExecutorImpl/ZoraCreator1155PremintExecutorImpl";
import { getTokenId } from "../../common/getTokenId";

export function handlePreminted(event: Preminted): void {
  const premint = new Premint(
    `${event.params.contractAddress.toHex()}-${event.params.tokenId.toHex()}-${event.params.minter.toHex()}}`
  );
  premint.uid = event.params.uid;
  premint.contractAddress = event.params.contractAddress;
  premint.tokenId = event.params.tokenId;
  premint.minter = event.params.minter;
  premint.tokenAndContract = getTokenId(
    event.params.contractAddress,
    event.params.tokenId
  );
  premint.createdNewContract = event.params.createdNewContract;

  premint.save();
}
