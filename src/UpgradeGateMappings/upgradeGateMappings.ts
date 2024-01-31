import {
  UpgradeRegistered,
  UpgradeRemoved,
} from "../../generated/UpgradePathsV1/UpgradeGate";
import { dataSource } from "@graphprotocol/graph-ts";

import { UpgradePath, UpgradeGate } from "../../generated/schema";
import { Bytes, store } from "@graphprotocol/graph-ts";

function upgradePathId(
  upgradeGateAddress: Bytes,
  from: Bytes,
  to: Bytes
): string {
  return `${upgradeGateAddress.toHex()}-${from.toHex()}-${to.toHex()}`;
}

export function handleUpgradeRegistered(event: UpgradeRegistered): void {
  const upgradeGateAddress = dataSource.address();

  const upgradeGate = new UpgradeGate(upgradeGateAddress);
  upgradeGate.type = dataSource.context().getString("contractType");
  upgradeGate.save();

  const upgradePath = new UpgradePath(
    upgradePathId(
      upgradeGateAddress,
      event.params.baseImpl,
      event.params.upgradeImpl
    )
  );
  upgradePath.upgradeGate = upgradeGate.id;
  upgradePath.from = event.params.baseImpl;
  upgradePath.to = event.params.upgradeImpl;

  upgradePath.save();
}

export function handleUpgradeRemoved(event: UpgradeRemoved): void {
  const upgradeGateAddress = dataSource.address();
  const upgradePath = UpgradePath.load(
    upgradePathId(
      upgradeGateAddress,
      event.params.baseImpl,
      event.params.upgradeImpl
    )
  );

  if (upgradePath) store.remove("UpgradePath", upgradePath.id);
}
