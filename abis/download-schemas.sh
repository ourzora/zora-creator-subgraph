if [ -n $NETWORK ]; then
  NETWORK=rinkeby
fi

curl https://rinkeby.ether.actor/$(cat ../config/rinkeby.json | jq '.factoryImpl' -r).json | jq '.abi' -r > ZoraNFTCreatorV1.json
curl https://rinkeby.ether.actor/$(cat ../config/rinkeby.json | jq '.dropMetadataAddress' -r).json | jq '.abi' -r > DropMetadataRenderer.json
curl https://rinkeby.ether.actor/$(cat ../config/rinkeby.json | jq '.editionMetadataAddress' -r).json | jq '.abi' -r > EditionMetadataRenderer.json