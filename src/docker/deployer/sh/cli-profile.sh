#!/bin/bash

# The Aptos CLI is really slow at running commands. Instead of calling
# `aptos account lookup-address` we can just parse the `account`
# field in the `/app/.aptos/config.yaml` file.
CONFIG_PATH="/app/.aptos/config.yaml"

function get_publisher_address() {
	if [ -f $CONFIG_PATH ]; then
		echo $(cat $CONFIG_PATH | yq -r '.profiles.publisher.account')
	else
		echo ""
	fi
}

function get_publisher_private_key() {
	if [ -f $CONFIG_PATH ]; then
		full_key=$(cat "$CONFIG_PATH" | yq -r '.profiles.publisher.private_key')
		key_only=$(echo "$full_key" | sed -E 's/^ed25519-priv-0x//')
		echo "$key_only"
	else
		echo ""
	fi
}
