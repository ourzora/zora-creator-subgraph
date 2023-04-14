import { ZoraCreatorRedeemConfig } from "../../../generated/schema";
import { RedeemMinterDeployed } from "../../../generated/templates/ZoraCreatorRedeemMinterFactory/ZoraCreatorRedeemMinterFactory";
import { makeTransaction } from "../../common/makeTransaction";

export function handleRedeemMinterDeployed(event: RedeemMinterDeployed): void {
  let config = new ZoraCreatorRedeemConfig(
    `${event.address.toHex()}-${event.params.minterContract.toHex()}`
  );
  config.creatorAddress = event.params.creatorContract;
  config.minterAddress = event.params.minterContract;
  config.txn = makeTransaction(event);

  config.save();
}
