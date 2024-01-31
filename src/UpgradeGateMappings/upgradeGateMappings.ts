import {
  UpgradeRegistered,
  UpgradeRemoved,
} from "../../generated/UpgradePathsV1155-1/UpgradeGate";
import { Address, dataSource } from "@graphprotocol/graph-ts";

import {
  UpgradePath,
  UpgradeGate,
  ContractVersion,
} from "../../generated/schema";
import { Bytes, store } from "@graphprotocol/graph-ts";
import { ZoraCreator1155Impl } from "../../generated/templates/ZoraCreator1155Impl/ZoraCreator1155Impl";

function upgradePathId(
  upgradeGateAddress: Bytes,
  from: Bytes,
  to: Bytes
): string {
  return `${upgradeGateAddress.toHex()}-${from.toHex()}-${to.toHex()}`;
}

function makeContractVersion(contractImplAddress: Address): ContractVersion {
  const contractVersion = new ContractVersion(contractImplAddress);
  const zoraCreator1155 = ZoraCreator1155Impl.bind(contractImplAddress);
  contractVersion.version = zoraCreator1155.try_contractVersion().value;

  contractVersion.save();

  return contractVersion;
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

  upgradePath.from = makeContractVersion(event.params.baseImpl).id;
  upgradePath.to = makeContractVersion(event.params.upgradeImpl).id;

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
