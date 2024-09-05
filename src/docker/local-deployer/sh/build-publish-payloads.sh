#!/bin/bash

json_dir="/app/json"
move_dir="/app/move"

# Because the local testnet must be up and running in order to initialize a
# profile, we just have the developer pass in the publisher's address at the
# image build time to avoid the need to run the local testnet in the image build
# process.
address=$EMOJICOIN_MODULE_ADDRESS

aptos move build-publish-payload \
	--assume-yes \
	--named-addresses \
        rewards=$address,integrator=$address,emojicoin_dot_fun=$address \
	--override-size-check \
	--included-artifacts none \
	--package-dir $move_dir/rewards/ \
	--json-output-file $json_dir/rewards.json

aptos move build-publish-payload \
	--assume-yes \
	--named-addresses emojicoin_dot_fun=$address \
	--override-size-check \
	--included-artifacts none \
	--package-dir $move_dir/emojicoin_dot_fun/ \
	--json-output-file $json_dir/emojicoin_dot_fun.json \
	--skip-fetch-latest-git-deps
