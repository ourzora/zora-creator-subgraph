# Create subgraphs

## Installation

The graph docs: https://thegraph.academy/developers/subgraph-development-guide/


Steps to deploy:

```
NETWORK=goerli yarn run codegen
NETWORK=goerli yarn run build
NETWORK=goerli DEPLOYMENT_PATH=kolber/zora-editions-goerli yarn run deploy
```

Will need to update the deployment path from your project path given in the subgraph


## Contracts & Deployed Apps

Backup main:
https://thegraph.com/hosted-service/subgraph/iainnash/zora-drops-mainnet

Main subgraph:
https://thegraph.com/hosted-service/subgraph/iainnash/zora-editions-mainnet

Rinkeby:
https://thegraph.com/hosted-service/subgraph/iainnash/erc721droprinkeby

Görli:
https://thegraph.com/hosted-service/subgraph/iainnash/erc721drop-goerli
