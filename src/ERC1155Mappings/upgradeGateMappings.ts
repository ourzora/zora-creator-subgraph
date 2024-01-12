import {
  UpgradeRegistered, UpgradeRemoved,
} from "../../generated/UpgradePathsV1/UpgradeGate";

import {
  ContractVersion,
  UpgradePath,
} from "../../generated/schema";
import { ZoraCreator1155Impl } from "../../generated/templates/ZoraCreator1155Impl/ZoraCreator1155Impl";
import { Address, Bytes, store } from "@graphprotocol/graph-ts";

function getContractVersion(address: Bytes): ContractVersion {
  const contractVersion = new ContractVersion(address);

  const zoraCreator1155Impl = ZoraCreator1155Impl.bind(address as Address);

  contractVersion.version = zoraCreator1155Impl.try_contractVersion().value;
  contractVersion.name = zoraCreator1155Impl.try_name().value;

  return contractVersion;
}

function upgradePathId(from: Bytes, to: Bytes): string {
  return `${from.toHex()}-${to.toHex()}`;
}

export function handleUpgradeRegistered(event: UpgradeRegistered): void {
  const fromVersion = getContractVersion(event.params.baseImpl);
  const toVersion = getContractVersion(event.params.upgradeImpl);
  
  const upgradePath = new UpgradePath(upgradePathId(event.params.baseImpl, event.params.upgradeImpl));
  upgradePath.from = fromVersion.id;
  upgradePath.to = toVersion.id;

  fromVersion.save();
  toVersion.save();
  upgradePath.save();
}

export function handleUpgradeRemoved(event: UpgradeRemoved): void {
  const upgradePath = UpgradePath.load(upgradePathId(event.params.baseImpl, event.params.upgradeImpl));

  if (upgradePath)
    store.remove("UpgradePath", upgradePath.id);
}

