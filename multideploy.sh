
version=$1

for element in ./config/*
do
  filename=$(basename $element)
  $network="${filename%.*}"
  NETWORK=$network yarn run build
  goldsky subgraph deploy zora-create-$network/$version
done
