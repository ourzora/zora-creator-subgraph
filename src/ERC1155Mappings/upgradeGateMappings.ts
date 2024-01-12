import {
  UpgradeRegistered, UpgradeRemoved,
} from "../../generated/UpgradePathsV1/UpgradeGate";

import {
  UpgradePath,
} from "../../generated/schema";
import { Bytes, store } from "@graphprotocol/graph-ts";

function upgradePathId(from: Bytes, to: Bytes): string {
  return `${from.toHex()}-${to.toHex()}`;
}

export function handleUpgradeRegistered(event: UpgradeRegistered): void {
  const upgradePath = new UpgradePath(upgradePathId(event.params.baseImpl, event.params.upgradeImpl));
  upgradePath.from = event.params.baseImpl;
  upgradePath.to = event.params.upgradeImpl;

  upgradePath.save();
}

export function handleUpgradeRemoved(event: UpgradeRemoved): void {
  const upgradePath = UpgradePath.load(upgradePathId(event.params.baseImpl, event.params.upgradeImpl));

  if (upgradePath)
    store.remove("UpgradePath", upgradePath.id);
}

