# requirements: jq, curl, goldsky cli

# enable errors
set -e

# arg 1 = version
version=$1
# arg 2 (optional) = networks
networks=$2
# arg 3 (optional) = fromversion
fromversion=$3
# arg 4 (optional) = fromcontract
fromcontract=$4


# production network tag
prodtag=stable

networkfiles=()
if [[ -n $networks ]]
then
  for p in ${networks//,/ }; do
    networkfiles+=("config/$p.json")
  done
else
  for file in ./config/*.json; do
    networkfiles+=($file)
  done
fi


function getSubgraphQueryPath() {
  network=$1
  echo "https://api.goldsky.com/api/public/project_clhk16b61ay9t49vm6ntn4mkz/subgraphs/zora-create-$network/$fromversion/gn"
}

function getDeploymentBlock() {
  response=$(curl -sS $1 -X POST -H 'Accept: application/json' -H 'content-type: application/json' --data-raw '{"query":"{\n  _meta{\n    block {\n      number\n    }\n    deployment\n  }\n}"}')
  echo $response | jq '.data._meta.block.number' -r
}

function getDeploymentBase() {
  response=$(curl -sS $1 -X POST -H 'Accept: application/json' -H 'content-type: application/json' --data-raw '{"query":"{\n  _meta{\n    block {\n      number\n    }\n    deployment\n  }\n}"}')
  echo $response | jq '.data._meta.deployment' -r
}

function getNetworkDeploymentBlock() {
  startBlock=$(cat config/$1.json | jq "$fromcontract | map(.startBlock | tonumber) | min")
  echo $startBlock
}


for element in ${networkfiles[@]}
do
  filename=$(basename $element)
  network="${filename%.*}"
  base=$(getSubgraphQueryPath $network)
  newjson=""
  if [[ -n $fromcontract ]]; then
    newjson="$(jq '. + {"grafting": {"base": "'$(getDeploymentBase $base)'", "block": '$(($(getNetworkDeploymentBlock $network) - 10))'}}' ./config/$network.json)"
  elif [[ -z $fromversion ]]; then
    echo 'skipping grafting'
    newjson="$(jq 'del(.grafting)' ./config/$network.json)"
  else
    newjson="$(jq '. + {"grafting": {"base": "'$(getDeploymentBase $base)'", "block": '$(($(getDeploymentBlock $base) - 10))'}}' ./config/$network.json)"
  fi
  echo $newjson
  echo "$newjson" > ./config/$network.json
  cat ./config/$network.json
  NETWORK=$network yarn run build
  goldsky subgraph deploy zora-create-$network/$version --overwrite
done
