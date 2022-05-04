import { CreatedEdition } from "../generated/ZoraNFTCreatorV1/ZoraNFTCreatorV1";
import {
  ContractConfig,
  ERC721Drop,
  NFTEditionSale,
  NFTEditionTransfer,
  SalesConfig,
  TransactionInfo,
} from "../generated/schema";
import { ERC721Drop as ERC721DropFactory } from "../generated/templates";
import {
  ERC721Drop as ERC721DropContract,
  FundsRecipientChanged,
  OpenMintFinalized,
  Sale,
  SalesConfigChanged,
  Transfer,
} from "../generated/templates/ERC721Drop/ERC721Drop";
import { Address, ethereum } from "@graphprotocol/graph-ts";

function makeTransaction(txn: ethereum.Event): string {
  const txnInfo = new TransactionInfo(txn.transaction.hash.toHex());
  txnInfo.block = txn.block.number;
  txnInfo.timestamp = txn.block.timestamp;
  txnInfo.save();

  return txnInfo.id;
}

function updateDropSupply(dropAddress: string): void {
  const dropContract = ERC721DropContract.bind(
    Address.fromString(dropAddress)
  );
  if (dropContract) {
    const saleDetails = dropContract.saleDetails();
    const drop = ERC721Drop.load(dropAddress);
    if (drop) {
      // Update the total minted counter
      drop.totalMinted = saleDetails.totalMinted;
      drop.maxSupply = saleDetails.maxSupply;
      drop.save();
    }
  }
}

export function handleCreatedEdition(event: CreatedEdition): void {
  const drop = new ERC721Drop(event.params.editionContractAddress.toHex());
  drop.address = event.params.editionContractAddress;

  const configId = `config-${drop.address.toHex()}`;
  const contractConfig = new ContractConfig(configId);
  contractConfig.drop = drop.address.toHex();

  const dropContract = ERC721DropContract.bind(
    Address.fromString(drop.address.toHex())
  );
  const dropConfig = dropContract.config();
  contractConfig.metadataRenderer = dropConfig.value0;
  contractConfig.editionSize = dropConfig.value1;
  contractConfig.royaltyBPS = dropConfig.value2;
  contractConfig.fundsRecipient = dropConfig.value3;
  contractConfig.save();

  drop.contractConfig = configId;
  const salesDetails = dropContract.saleDetails();
  drop.totalMinted = salesDetails.totalMinted;
  drop.maxSupply = salesDetails.maxSupply;

  drop.name = dropContract.name();
  drop.symbol = dropContract.symbol();

  const salesConfigId = event.transaction.hash.toHex();
  const salesConfig = new SalesConfig(salesConfigId);
  drop.salesConfig = salesConfigId;
  salesConfig.drop = drop.address.toHex();
  salesConfig.save();

  drop.created = makeTransaction(event);
  drop.creator = event.transaction.from;
  drop.save();

  ERC721DropFactory.create(event.params.editionContractAddress);
}

export function handleSalesConfigChanged(event: SalesConfigChanged): void {
  const drop = ERC721Drop.load(event.address.toHex());

  const newSalesConfigId = event.transaction.hash.toHex();
  const newSalesConfig = new SalesConfig(newSalesConfigId);
  newSalesConfig.drop = event.address.toHex();
  newSalesConfig.presaleEnd = event.params.salesConfig.presaleEnd;
  newSalesConfig.presaleStart = event.params.salesConfig.presaleStart;
  newSalesConfig.publicSaleEnd = event.params.salesConfig.publicSaleEnd;
  newSalesConfig.publicSaleStart = event.params.salesConfig.publicSaleStart;
  newSalesConfig.publicSalePrice = event.params.salesConfig.publicSalePrice;
  newSalesConfig.maxSalePurchasePerAddress =
    event.params.salesConfig.maxSalePurchasePerAddress;
  newSalesConfig.presaleMerkleRoot = event.params.salesConfig.presaleMerkleRoot;

  newSalesConfig.save();

  if (drop) {
    drop.salesConfig = newSalesConfigId;
    drop.save();
  }
}

export function handleOpenMintFinalized(event: OpenMintFinalized): void {
  const config = ContractConfig.load(event.address.toHex());

  if (config) {
    config.editionSize = event.params.numberOfMints;
    config.save();
  }
}

export function handleFundsRecipientChanged(
  event: FundsRecipientChanged
): void {
  const config = ContractConfig.load(event.address.toHex());

  if (config) {
    config.fundsRecipient = event.params.newAddress;
    config.save();
  }
}

export function handleNFTTransfer(event: Transfer): void {
  const transfer = new NFTEditionTransfer(event.transaction.hash.toHex());
  transfer.to = event.params.to;
  transfer.from = event.params.from;
  transfer.txn = makeTransaction(event);
  transfer.tokenId = event.params.tokenId;
  transfer.drop = event.address.toHex();

  updateDropSupply(event.address.toHex());

  transfer.save();
}

export function handleSale(event: Sale): void {
  const sale = new NFTEditionSale(event.transaction.hash.toHex());
  sale.pricePerToken = event.params.pricePerToken;
  sale.priceTotal = event.transaction.value;
  sale.purchaser = event.transaction.from;
  sale.txn = makeTransaction(event);
  sale.firstPurchasedTokenId = event.params.firstPurchasedTokenId.toI32();
  sale.count = event.params.quantity;
  sale.drop = event.address.toHex();

  updateDropSupply(event.address.toHex());

  sale.save();
}
