import { ZoraCreatorRedeemConfig } from "../../../generated/schema";
import { ZoraCreatorRedeemMinterStrategy } from "../../../generated/templates";
import { RedeemMinterDeployed } from "../../../generated/templates/ZoraCreatorRedeemMinterFactory/ZoraCreatorRedeemMinterFactory";
import { makeTransaction } from "../../common/makeTransaction";

export function handleRedeemMinterDeployed(event: RedeemMinterDeployed): void {
  let config = new ZoraCreatorRedeemConfig(
    `${event.address.toHex()}-${event.params.minterContract.toHex()}`
  );
  config.creatorAddress = event.params.creatorContract;
  config.minterAddress = event.params.minterContract;
  config.txn = makeTransaction(event);

  // Listen for new events from the created strategy contract.
  ZoraCreatorRedeemMinterStrategy.create(event.params.minterContract);

  config.save();
}
