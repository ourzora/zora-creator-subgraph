ERC721_ARTIFACTS_PATH=../node_modules/@zoralabs/nft-drop-contracts/dist/artifacts/
ERC1155_ARTIFACTS_PATH=../node_modules/@zoralabs/zora-creator-contracts/dist/artifacts/

get_contract () {
  jq -c '.abi' $1/$2.sol/$2.json > ./$2.json
}

# 721 drop contracts
get_contract $ERC721_ARTIFACTS_PATH 'ERC721Drop'
get_contract $ERC721_ARTIFACTS_PATH 'ZoraNFTCreatorV1'
get_contract $ERC721_ARTIFACTS_PATH 'EditionMetadataRenderer'
get_contract $ERC721_ARTIFACTS_PATH 'DropMetadataRenderer'

# 1155 creator impl contracts
get_contract $ERC1155_ARTIFACTS_PATH 'ZoraCreator1155Impl'
get_contract $ERC1155_ARTIFACTS_PATH 'ZoraCreator1155Proxy'

# 1155 creator factory contracts
get_contract $ERC1155_ARTIFACTS_PATH 'ZoraCreator1155FactoryImpl'
get_contract $ERC1155_ARTIFACTS_PATH 'ZoraCreator1155FactoryProxy'

# minters 1155
get_contract $ERC1155_ARTIFACTS_PATH 'ZoraCreatorFixedPriceSaleStrategy'
get_contract $ERC1155_ARTIFACTS_PATH 'ZoraCreatorMerkleMinterStrategy'
