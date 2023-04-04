import { RedeemMinterDeployed } from "../../../generated/templates/ZoraCreatorRedeemMinterFactory/ZoraCreatorRedeemMinterFactory";
import { ZoraCreatorRedeemConfig } from "../../../generated/schema";

export function handleRedeemMinterDeployed(event: RedeemMinterDeployed): void {
  let config = new ZoraCreatorRedeemConfig(event.transaction.hash.toHex());
  config.creatorAddress = event.params.creatorContract;
  config.minterAddress = event.params.minterContract;

  config.save();
}
