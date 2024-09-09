#!/bin/bash
# cspell:word localnet

# Sometimes when the CLI container `local-testnet-postgres` is stopped, it
# doesn't remove its volume data with it, but the next start will restart
# the chain from genesis. This means the indexer database has stale data
# from an old localnet.
# The simplest way to check if the two are in sync is to check if the data
# for transaction version 1 has the same unique data in both the indexer API
# and the REST API.

function check_if_stale() {
	query='
  query FirstBlockMetadata {
    block_metadata_transactions(where: {version: {_eq: "1"}}) {
      proposer
    }
  }
  '

	set -e

	graphql_endpoint="http://localhost:8090/v1/graphql"

	response=$(curl -s -X POST \
		-H "Content-Type: application/json" \
		-d "{\"query\": $(echo $query | jq -R -s -c .)}" \
		"$graphql_endpoint")

	selector='.data.block_metadata_transactions[0].proposer'
	proposer1=$(echo $response | jq -r "$selector")

	rest_api_endpoint="http://localhost:8080/v1/transactions/by_version/1"
	proposer2=$(curl -s "$rest_api_endpoint" | jq -r '.proposer')

	if [[ $proposer1 == "$proposer2" ]]; then
		echo "The indexer and the localnet are in sync, we're good to go!"
		exit 0
	else
		echo "ERROR: The localnet indexer has stale data from an old container."
		solution_msg="Please prune the stale 'local-testnet-postgres-data' "
		solution_msg+='volume or run `utils/prune.sh`.'
		echo "$solution_msg"
		echo "Proposer at transaction version 1, from the indexer API: $proposer1"
		echo "Proposer at transaction version 1, from the REST API: $proposer2"
		exit 1
	fi
}

check_if_stale
