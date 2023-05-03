import { RedeemMinterDeployed } from "../../../generated/templates/ZoraCreatorRedeemMinterFactory/ZoraCreatorRedeemMinterFactory";
import { ZoraCreatorRedeemConfig } from "../../../generated/schema";
import { makeTransaction } from "../../common/makeTransaction";
import { ZoraCreatorRedeemMinterStrategy } from "../../../generated/templates";

export function handleRedeemMinterDeployed(event: RedeemMinterDeployed): void {
  let config = new ZoraCreatorRedeemConfig(
    `${event.address.toHex()}-${event.params.minterContract.toHex()}`
  );
  config.creatorAddress = event.params.creatorContract;
  config.minterAddress = event.params.minterContract;
  config.txn = makeTransaction(event)

  ZoraCreatorRedeemMinterStrategy.create(event.params.minterContract);

  config.save();
}
