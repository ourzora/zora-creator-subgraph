# requirements: jq, curl, goldsky cli

# enable errors
set -e

# arg 1 = version
version=$1
# arg 2 (optional) = networks
networks=$2
# arg 3 (optional) = fromversion
fromversion=$3


# production network tag
prodtag=stable

if [[ -eq $fromversion "no-graft" ]]
then
  fromversion=no-graft
else if [[ -n $fromversion ]]
then
  fromversion=stable
fi

networkfiles=()
if [[ -n $networks ]]
then
  for p in ${networks//,/ }; do
    networkfiles+=("config/$p.json")
  done
else
  for file in ./config/*.json; do
    networkfiles+=$file
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

echo $networkfiles
for element in "${networkfiles[@]}"
do
  filename=$(basename $element)
  network="${filename%.*}"
  base=$(getSubgraphQueryPath $network)
  if [[ -ne fromversion "no-graft" ]]; then
    newjson="$(jq '. + {"grafting": {"base": "'$(getDeploymentBase $base)'", "block": '$(($(getDeploymentBlock $base) - 10))'}}' ./config/$network.json)"
    echo $newjson
    echo "$newjson" > ./config/$network.json
    cat ./config/$network.json
  fi
  NETWORK=$network yarn run build
  goldsky subgraph deploy zora-create-$network/$version
done