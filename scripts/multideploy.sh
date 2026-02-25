# requirements: jq

# enable errors
set -e

# arg 1 (optional) = networks
networks=$1

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


for element in ${networkfiles[@]}
do
  filename=$(basename $element)
  network="${filename%.*}"
  # newjson=""
  # echo $newjson
  # echo "$newjson" > ./config/$network.json
  cat ./config/$network.json
  NETWORK=$network yarn run build
done
