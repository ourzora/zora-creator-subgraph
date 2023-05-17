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
  OnChainMetadataHistory,
  KnownRenderer,
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
  UpdatedMetadataRenderer,
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
} from "../../constants/erc721RoleUtils";
import { getDefaultTokenId, getTokenId } from "../../common/getTokenId";
import { METADATA_CUSTOM_RENDERER } from "../../constants/metadataHistoryTypes";
import { getOnChainMetadataKey } from "../../common/getOnChainMetadataKey";

/* sales config updated */

export function handleSalesConfigChanged(event: SalesConfigChanged): void {
  const dropContract = ERC721DropContract.bind(
    Address.fromString(event.address.toHex())
  );

  const salesConfigObject = dropContract.salesConfig();

  if (!salesConfigObject.getPresaleMerkleRoot().equals(Bytes.empty())) {
    const presaleConfigId = getSalesConfigOnLegacyMarket(
      // market is the same as media contract for this impl
      // token ID for 721 is 0
      event.address,
      SALE_CONFIG_PRESALE
    );
    const strategyPresale = new SalesConfigMerkleMinterStrategy(
      presaleConfigId
    );
    strategyPresale.configAddress = event.address;
    strategyPresale.tokenId = BigInt.zero();
    strategyPresale.contract = event.address.toHexString();
    strategyPresale.presaleStart = salesConfigObject.getPresaleStart();
    strategyPresale.presaleEnd = salesConfigObject.getPresaleEnd();
    strategyPresale.merkleRoot = salesConfigObject.getPresaleMerkleRoot();

    const txn = makeTransaction(event);
    strategyPresale.address = event.address;
    strategyPresale.block = event.block.number;
    strategyPresale.timestamp = event.block.timestamp;
    strategyPresale.txn = txn;
    strategyPresale.save();

    // make a join table
    const presaleJoin = new SalesStrategyConfig(presaleConfigId);
    presaleJoin.contract = event.address.toHexString();

    presaleJoin.txn = txn;
    presaleJoin.address = event.address;
    presaleJoin.block = event.block.number;
    presaleJoin.timestamp = event.block.timestamp;

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

    const txn = makeTransaction(event);
    fixedPriceSaleStrategy.txn = txn;
    fixedPriceSaleStrategy.block = event.block.number;
    fixedPriceSaleStrategy.timestamp = event.block.timestamp;
    fixedPriceSaleStrategy.address = event.address;

    fixedPriceSaleStrategy.tokenId = BigInt.zero();
    fixedPriceSaleStrategy.configAddress = event.address;
    fixedPriceSaleStrategy.contract = event.address.toHexString();
    fixedPriceSaleStrategy.maxTokensPerAddress = salesConfigObject.getMaxSalePurchasePerAddress();
    fixedPriceSaleStrategy.saleStart = salesConfigObject.getPublicSaleStart();
    fixedPriceSaleStrategy.saleEnd = salesConfigObject.getPublicSaleEnd();
    fixedPriceSaleStrategy.pricePerToken = salesConfigObject.getPublicSalePrice();
    fixedPriceSaleStrategy.save();

    // make a join table
    const fixedPriceSaleJoin = new SalesStrategyConfig(publicSaleConfigId);
    fixedPriceSaleJoin.contract = event.address.toHexString();

    fixedPriceSaleJoin.txn = txn;
    fixedPriceSaleJoin.address = event.address;
    fixedPriceSaleJoin.block = event.block.number;
    fixedPriceSaleJoin.timestamp = event.block.timestamp;

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
      royalties.save();
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
  permissions.block = event.block.number;
  permissions.timestamp = event.block.timestamp;

  permissions.user = event.params.account;
  permissions.tokenId = BigInt.zero();

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

  const role = event.params.role;
  if (role.equals(Bytes.fromHexString(KNOWN_TYPE_DEFAULT_ADMIN))) {
    permissions.isAdmin = false;
  }
  if (role.equals(Bytes.fromHexString(KNOWN_TYPE_MINTER_ROLE))) {
    permissions.isMinter = false;
  }
  if (role.equals(Bytes.fromHexString(KNOWN_TYPE_SALES_MANAGER_ROLE))) {
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

export function handleUpdatedMetadataRenderer(
  event: UpdatedMetadataRenderer
): void {
  const createContract = ZoraCreateContract.load(event.address.toHex());
  if (createContract) {
    createContract.rendererContract = event.params.renderer;
  }

  const createToken = ZoraCreateToken.load(getDefaultTokenId(event.address));
  if (!createToken) {
    return;
  }

  createToken.rendererContract = event.params.renderer;
  createToken.save();

  if (!KnownRenderer.load(event.params.renderer.toHex())) {
    const history = new OnChainMetadataHistory(getOnChainMetadataKey(event));
    history.tokenAndContract = getDefaultTokenId(event.address);
    history.knownType = METADATA_CUSTOM_RENDERER;
    history.createdAtBlock = event.block.timestamp;
    history.rendererAddress = event.params.renderer;
    history.txn = makeTransaction(event);
    history.save();
  }
}

/* NFT transfer event */

export function handleNFTTransfer(event: Transfer): void {
  const createToken = ZoraCreateToken.load(getDefaultTokenId(event.address));
  if (!createToken) {
    return;
  }
  if (event.params.from.equals(Address.zero())) {
    createToken.totalMinted = createToken.totalMinted.plus(BigInt.fromI32(1));
    createToken.totalSupply = createToken.totalSupply.plus(BigInt.fromI32(1));
  }
  if (event.params.to.equals(Address.zero())) {
    createToken.totalSupply = createToken.totalSupply.minus(BigInt.fromI32(1));
  }
  createToken.save();
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
