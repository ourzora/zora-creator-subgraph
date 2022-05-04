#!/bin/bash

select result in mainnet polygon polygon-mumbai rinkeby
do  
   if [ $result == "mainnet" ] || [ $result == "rinkeby" ] || [ $result == "polygon" ] || [ $result == "polygon-mumbai" ]; 
   then
      break;
   else
      echo "Incorrect, please try again: "
   fi
done

mustache config/$result.json subgraph.template.yaml > subgraph.yaml

echo "configured for $result"

graph codegen && graph build

echo "wooohooo regen & built!"

if [ $result == "mainnet" ]# || [ $result == "rinkeby" ]; 
then
   # subgraph studio
   graph deploy --studio nft-editions-$result
else 
   # hosted services (deprecating once fully ported to studio)
   read -p 'github username: ' uservar
   read -p 'access token: ' accessToken
   
   graph auth --product hosted-service $accessToken
   graph deploy --product hosted-service $uservar/nft-editions-$result
fi