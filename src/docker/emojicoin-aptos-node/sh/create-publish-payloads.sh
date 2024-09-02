#!/bin/bash

root_dir=$(git rev-parse --show-toplevel)
docker_dir="$root_dir/src/docker"
move_dir="$root_dir/src/move"

json_output_dir="$docker_dir/emojicoin-aptos-node/json"
emojicoin_json_path="$json_output_dir/publish-emojicoin_dot_fun.json"
rewards_json_path="$json_output_dir/publish-rewards.json"

source $docker_dir/.env

git fetch --depth 1 origin main

address="$EMOJICOIN_MODULE_ADDRESS"
aptos move build-publish-payload \
    --assume-yes \
    --private-key $PUBLISHER_PK \
    --encoding hex \
    --named-addresses emojicoin_dot_fun=$address \
    --override-size-check \
    --included-artifacts none \
    --package-dir $move_dir/emojicoin_dot_fun/ \
    --json-output-file $emojicoin_json_path &

aptos move build-publish-payload \
    --assume-yes \
    --private-key $PUBLISHER_PK \
    --encoding hex \
    --named-addresses rewards=$address,integrator=$address,emojicoin_dot_fun=$address \
    --override-size-check \
    --included-artifacts none \
    --package-dir $move_dir/rewards/ \
    --json-output-file $rewards_json_path
