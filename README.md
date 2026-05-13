# Zora Creator Subgraph

This subgraph indexes all Zora creator contracts (both 721 and 1155) along with creator rewards.

Main entities can be found in `schema.graphql`.

To add new chains, new configuration files can be added to the `config/` folder. The config chain name needs to match the network name in the graph indexer instance used.

This subgraph uses metadata IPFS indexing and subgraph optional features.

## Installation

The graph docs: https://thegraph.academy/developers/subgraph-development-guide/

After `git clone` run `yarn` to install dependencies.

Steps to build:

NETWORK=zora yarn run build

NETWORK needs to be a name of a valid network configuration file in `config/`.

After building, you can use the graph cli or goldsky cli to deploy the built subgraph for the network specified above.

## Deployment shortcuts

Only supports goldsky deploys for now.

> For existing networks, prefer grafted deployments whenever possible.
> Deploying without grafting forces the subgraph to reindex from the configured
> start blocks, which can take a long time due to historical creator contract
> events, rewards indexing, and metadata IPFS processing.

Grafts subgraph from FROM_VERSION:

./scripts/multideploy.sh NEW_VERSION NETWORKS FROM_VERSION

Example:

./scripts/multideploy.sh 1.10.0 zora-testnet,optimism-goerli,base-goerli 1.8.0

Deploys without grafting:

./scripts/multideploy.sh NEW_VERSION NETWORKS

Example:

./scripts/multideploy.sh 1.10.0 zora-testnet,optimism-goerli,base-goerli

Deploys a new version for all networks without grafting:

./scripts/multideploy.sh NEW_VERSION

> Warning: this is not typical. Full reindexing can take a long time on mature
> networks and should generally be reserved for schema-breaking changes,
> corrupted deployments, or intentional backfills.