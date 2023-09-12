REL_BASE=$(dirname "$0")

ERC721_ARTIFACTS_PATH=$REL_BASE/../node_modules/@zoralabs/nft-drop-contracts/dist/artifacts/
ERC1155_ARTIFACTS_PATH=$REL_BASE/../node_modules/@zoralabs/zora-1155-contracts/dist/artifacts/
PROTOCOL_REWARDS_ARTIFACTS_PATH=$REL_BASE/../node_modules/@zoralabs/protocol-rewards/dist/artifacts/

get_contract () {
  node -e 'var fs = require("fs");console.log(JSON.stringify(JSON.parse(fs.readFileSync(process.argv[1])).abi, null, 2))' $1/$2.sol/$2.json > $REL_BASE/$2.json
}

# 721 drop contracts
get_contract $ERC721_ARTIFACTS_PATH 'ERC721Drop'
get_contract $ERC721_ARTIFACTS_PATH 'ZoraNFTCreatorV1'
get_contract $ERC721_ARTIFACTS_PATH 'EditionMetadataRenderer'
get_contract $ERC721_ARTIFACTS_PATH 'DropMetadataRenderer'

# 1155 creator impl contracts
get_contract $ERC1155_ARTIFACTS_PATH 'ZoraCreator1155Impl'
get_contract $ERC1155_ARTIFACTS_PATH 'Zora1155'

# 1155 creator factory contracts
get_contract $ERC1155_ARTIFACTS_PATH 'ZoraCreator1155FactoryImpl'
get_contract $ERC1155_ARTIFACTS_PATH 'Zora1155Factory'

# minters 1155
get_contract $ERC1155_ARTIFACTS_PATH 'ZoraCreatorFixedPriceSaleStrategy'
get_contract $ERC1155_ARTIFACTS_PATH 'ZoraCreatorMerkleMinterStrategy'
get_contract $ERC1155_ARTIFACTS_PATH 'ZoraCreatorRedeemMinterFactory'
<<<<<<< HEAD
get_contract $ERC1155_ARTIFACTS_PATH 'ZoraCreatorRedeemMinterStrategy'

# protocol rewards contract
get_contract $PROTOCOL_REWARDS_ARTIFACTS_PATH 'ProtocolRewards'
=======
get_contract $ERC1155_ARTIFACTS_PATH 'ZoraCreatorRedeemMinterStrategy'
>>>>>>> origin/main
