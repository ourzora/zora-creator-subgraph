# Create subgraphs

## Installation

The graph docs: https://thegraph.academy/developers/subgraph-development-guide/


Steps to build:

```
NETWORK=goerli yarn run build

```

NETWORK needs to be a name of a valid network configuration file in `addresses/`.


Will need to update the deployment path from your project path given in the subgraph


## Deployment shortcust

Does grafting from FROM_VERSION:

./scripts/multideploy.sh NEW_VERSION NETWORKS FROM_VERSION

./scripts/multideploy.sh 1.10.0 zora-testnet,optimism-goerli,base-goerli 1.8.0

Deploys without grafting:

./scripts/multideploy.sh NEW_VERSION NETWORKS

./scripts/multideploy.sh 1.10.0 zora-testnet,optimism-goerli,base-goerli

Deploys a new version for _all_ networks without grafting: (not recommended)

./scripts/multideploy.sh NEW_VERSION

