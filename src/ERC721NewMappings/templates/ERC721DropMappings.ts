import { Address, bigInt, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { makeTransaction } from "../../common/makeTransaction";

import {
  ZoraCreateContract,
  SalesConfigMerkleMinterStrategy,
  SalesStrategyConfig,
  SalesConfigFixedPriceSaleStrategy,
  ZoraCreatorPermission,
  ZoraCreateToken,
  RoyaltyConfig,
} from "../../../generated/schema";

import {
  ERC721Drop as ERC721DropContract,
  FundsRecipientChanged,
  OpenMintFinalized,
  OwnershipTransferred,
  RoleGranted,
  RoleRevoked,
  SalesConfigChanged,
  Transfer,
  Upgraded,
} from "../../../generated/templates/ERC721Drop/ERC721Drop";
import { getSalesConfigOnLegacyMarket } from "../../common/getSalesConfigKey";
import {
  SALE_CONFIG_PRESALE,
  SALE_CONFIG_FIXED_PRICE,
} from "../../constants/salesConfigTypes";
import { getPermissionsKey } from "../../common/getPermissionsKey";
import {
  KNOWN_TYPE_DEFAULT_ADMIN,
  KNOWN_TYPE_MINTER_ROLE,
  KNOWN_TYPE_SALES_MANAGER_ROLE,
} from "../../ERC721LegacyMappings/utils/roleUtils";
import { getDefaultTokenId } from "../../common/getTokenId";

/* sales config updated */

export function handleSalesConfigChanged(event: SalesConfigChanged): void {
  const dropContract = ERC721DropContract.bind(
    Address.fromString(event.address.toHex())
  );

  const salesConfigObject = dropContract.salesConfig();

  if (
    salesConfigObject.getPresaleMerkleRoot() ==
    Bytes.fromHexString("0x0000000000000000000000000000000000000000")
  ) {
    const presaleConfigId = getSalesConfigOnLegacyMarket(
      // market is the same as media contract for this impl
      // token ID for 721 is 0
      event.address,
      SALE_CONFIG_PRESALE
    );
    const strategyPresale = new SalesConfigMerkleMinterStrategy(
      presaleConfigId
    );
    strategyPresale.tokenId = BigInt.zero();
    strategyPresale.contract = event.address.toHexString();
    strategyPresale.presaleStart = salesConfigObject.getPresaleStart();
    strategyPresale.presaleEnd = salesConfigObject.getPresaleEnd();
    strategyPresale.merkleRoot = salesConfigObject.getPresaleMerkleRoot();
    strategyPresale.txn = makeTransaction(event);
    strategyPresale.save();

    // make a join table
    const presaleJoin = new SalesStrategyConfig(presaleConfigId);
    presaleJoin.contract = event.address.toHexString();
    presaleJoin.txn = makeTransaction(event);
    presaleJoin.presale = presaleConfigId;
    presaleJoin.type = SALE_CONFIG_PRESALE;
    presaleJoin.save();
  }

  if (salesConfigObject.getPublicSaleEnd() != BigInt.zero()) {
    const publicSaleConfigId = getSalesConfigOnLegacyMarket(
      // market is the same as media contract for this impl
      // token ID for 721 is 0
      event.address,
      SALE_CONFIG_FIXED_PRICE
    );

    const fixedPriceSaleStrategy = new SalesConfigFixedPriceSaleStrategy(
      publicSaleConfigId
    );
    fixedPriceSaleStrategy.tokenId = BigInt.zero();
    fixedPriceSaleStrategy.contract = event.address.toHexString();
    fixedPriceSaleStrategy.maxTokensPerAddress = salesConfigObject.getMaxSalePurchasePerAddress();
    fixedPriceSaleStrategy.saleStart = salesConfigObject.getPublicSaleStart();
    fixedPriceSaleStrategy.saleEnd = salesConfigObject.getPublicSaleEnd();
    fixedPriceSaleStrategy.pricePerToken = salesConfigObject.getPublicSalePrice();
    fixedPriceSaleStrategy.txn = makeTransaction(event);
    fixedPriceSaleStrategy.save();

    // make a join table
    const fixedPriceSaleJoin = new SalesStrategyConfig(publicSaleConfigId);
    fixedPriceSaleJoin.contract = event.address.toHexString();
    fixedPriceSaleJoin.txn = makeTransaction(event);
    fixedPriceSaleJoin.fixedPrice = publicSaleConfigId;
    fixedPriceSaleJoin.type = SALE_CONFIG_FIXED_PRICE;
    fixedPriceSaleJoin.save();
  }
}

/* handle upgraded – updates contract version */

export function handleUpgraded(event: Upgraded): void {
  const drop = ERC721DropContract.bind(event.address);
  if (drop) {
    const version = drop.contractVersion();
    const savedContract = ZoraCreateContract.load(event.address.toHexString());
    if (savedContract) {
      savedContract.contractVersion = version.toString();
      const dropConfig = drop.config();
      const royalties = new RoyaltyConfig(event.address.toHexString());
      royalties.royaltyRecipient = dropConfig.getFundsRecipient();
      royalties.royaltyMintSchedule = BigInt.zero();
      royalties.contract = savedContract.id;
      royalties.tokenId = BigInt.zero();
      royalties.royaltyBPS = BigInt.fromU64(dropConfig.getRoyaltyBPS());
      savedContract.save();
    }
  }
}

/* role mappings */

export function handleRoleGranted(event: RoleGranted): void {
  const id = getPermissionsKey(
    event.params.account,
    event.address,
    BigInt.zero()
  );

  let permissions = ZoraCreatorPermission.load(id);

  if (!permissions) {
    permissions = new ZoraCreatorPermission(id);
    permissions.isAdmin = false;
    permissions.isFundsManager = false;
    permissions.isMetadataManager = false;
    permissions.isSalesManager = false;
    permissions.isMinter = false;
  }
  permissions.user = event.params.account;
  permissions.tokenId = BigInt.zero();
  permissions.raw = event.params.role;

  if (event.params.role.equals(Bytes.fromHexString(KNOWN_TYPE_DEFAULT_ADMIN))) {
    permissions.isAdmin = true;
  }
  if (event.params.role.equals(Bytes.fromHexString(KNOWN_TYPE_MINTER_ROLE))) {
    permissions.isMinter = true;
  }
  if (
    event.params.role.equals(Bytes.fromHexString(KNOWN_TYPE_SALES_MANAGER_ROLE))
  ) {
    permissions.isSalesManager = true;
  }

  permissions.txn = makeTransaction(event);
  permissions.contract = event.address.toHexString();

  permissions.save();
}

export function handleRoleRevoked(event: RoleRevoked): void {
  const id = getPermissionsKey(
    event.params.account,
    event.address,
    BigInt.zero()
  );

  let permissions = ZoraCreatorPermission.load(id);
  if (!permissions) {
    return;
  }

  const roleHex = event.params.role.toHexString().toLowerCase();
  if (roleHex === KNOWN_TYPE_DEFAULT_ADMIN) {
    permissions.isAdmin = false;
  }
  if (roleHex === KNOWN_TYPE_MINTER_ROLE) {
    permissions.isMinter = false;
  }
  if (roleHex === KNOWN_TYPE_SALES_MANAGER_ROLE) {
    permissions.isSalesManager = false;
  }

  permissions.txn = makeTransaction(event);
  permissions.contract = event.address.toHexString();
  permissions.user = event.params.account;

  permissions.save();
}

/* finalized */

export function handleOpenMintFinalized(event: OpenMintFinalized): void {
  const id = getDefaultTokenId(event.address);

  const token = ZoraCreateToken.load(id);
  if (token) {
    token.maxSupply = event.params.numberOfMints;
    token.save();
  }
}

/* funds recipient changed */

export function handleFundsRecipientChanged(
  event: FundsRecipientChanged
): void {
  const fixedPriceSale = SalesConfigFixedPriceSaleStrategy.load(
    getSalesConfigOnLegacyMarket(event.address, SALE_CONFIG_FIXED_PRICE)
  );
  if (fixedPriceSale) {
    fixedPriceSale.fundsRecipient = event.params.newAddress;
    fixedPriceSale.save();
  }

  const merkleStrategyPrice = SalesConfigMerkleMinterStrategy.load(
    getSalesConfigOnLegacyMarket(event.address, SALE_CONFIG_PRESALE)
  );
  if (merkleStrategyPrice) {
    merkleStrategyPrice.fundsRecipient = event.params.newAddress;
    merkleStrategyPrice.save();
  }

  const royaltyConfig = RoyaltyConfig.load(event.address.toHexString());
  if (royaltyConfig) {
    royaltyConfig.royaltyRecipient = event.params.newAddress;
    royaltyConfig.save();
  }
}

/* NFT transfer event */

export function handleNFTTransfer(event: Transfer): void {
  const createToken = ZoraCreateToken.load(getDefaultTokenId(event.address));
  if (!createToken) {
    return;
  }
  createToken.totalMinted = createToken.totalMinted.plus(BigInt.fromI32(1));
  createToken.totalSupply = createToken.totalSupply.plus(BigInt.fromI32(1));
}

/* handle ownership transfer */

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  const createContract = ZoraCreateContract.load(event.address.toHexString());
  if (!createContract) {
    return;
  }
  createContract.owner = event.params.newOwner;
  createContract.save();
}
