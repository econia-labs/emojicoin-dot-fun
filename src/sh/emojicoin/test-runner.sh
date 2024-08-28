#!/bin/bash
# cspell:word toplevel
# cspell:word localnode
# cspell:word buildable

# ------------------------------------------------------------------------------
#                            Setup for absolute paths
# ------------------------------------------------------------------------------
# Resolve the docker directory to its absolute path to avoid issues.
root_dir=$(git rev-parse --show-toplevel)
docker_dir="$root_dir/src/docker"
move_dir="$root_dir/src/move"

# Store the original working directory to return to upon exit.
original_cwd=$(pwd)

cd "$docker_dir" || exit 1

function cleanup() {
	cd "$original_cwd" || exit 1
}

# Ensure cleanup function is called on exit.
trap cleanup EXIT

# ------------------------------------------------------------------------------
#                                  Display Help
# ------------------------------------------------------------------------------

show_help() {
	echo "Usage: $0 [OPTION]"
	echo "Control the Docker Compose environment with a local testnet."
	echo
	echo "Options:"
	echo "  -p, --pull        Pull Docker images for the environment."
	echo "  -b, --build       Build Docker images for the environment."
	echo "  -r, --reset       Reset all containers and volumes, including the local testnet."
	echo "  -s, --start       Start the Docker environment with the local testnet."
	echo "  -j, --json        Publish the smart contracts with JSON publish payload files."
	echo "  -c, --compile     Publish the smart contracts by compiling at container build time."
	echo "  --no-cache  	  Do not use cache when building the Docker images."
	echo "  --no-frontend     Do not start the frontend container."
	echo
	echo "  -h, --help        Display this help message"
	echo
	echo "You can specify both options to reset and then start the environment."
	echo "You must specify either the JSON or compile option to publish the smart contracts."
}

# ------------------------------------------------------------------------------
#                          Parse command line arguments
# ------------------------------------------------------------------------------

reset=false
start=false
include_frontend=true
pull=false
build=false
show_help=false
publish_json=false
publish_compile=false
no_cache=false
localnode="local-testnet-postgres"
graphql="local-testnet-indexer-api"

base_compose="compose.yaml"
localnode_compose="compose.localnode.yaml"
frontend_compose="compose.frontend.yaml"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
	case $1 in
	--reset) reset=true ;;
	-r) reset=true ;;
	--start) start=true ;;
	-s) start=true ;;
	--no-frontend) include_frontend=false ;;
	--pull) pull=true ;;
	-p) pull=true ;;
	--build) build=true ;;
	-b) build=true ;;
	--json) publish_json=true ;;
	-j) publish_json=true ;;
	--compile) publish_compile=true ;;
	-c) publish_compile=true ;;
	--no-cache) no_cache=true ;;
	-h | --help)
		show_help
		exit 0
		;;
	*)
		echo "Unknown parameter passed: $1"
		show_help
		exit 1
		;;
	esac
	shift
done

compose_args=""

if [ "$include_frontend" = true ]; then
	compose_args="-f $base_compose -f $localnode_compose -f $frontend_compose"
else
	compose_args="-f $base_compose -f $localnode_compose"
fi

# ------------------------------------------------------------------------------
#                             Main script functions
# ------------------------------------------------------------------------------

reset_container_resources() {
	# Remove the frontend container regardless of whether or not it was started;
	# otherwise, there will be a dangling/orphaned container.
	all_compose_files="-f $base_compose -f $localnode_compose -f $frontend_compose"

	echo "Resetting the remaining containers and volumes..."
	docker compose $all_compose_files down --volumes

	echo "Resetting local testnet containers and volumes..."
	docker stop $localnode $graphql
	docker rm -f $localnode $graphql --volumes 2>/dev/null
}

build_containers() {
	echo "Building Docker images..."
	if [ "$no_cache" = true ]; then
		docker compose $compose_args build --no-cache
	else
		docker compose $compose_args build
	fi
}

start_containers() {
	echo "Starting local testnet..."
	docker compose $compose_args up -d --force-recreate
}

pull_images() {
	echo "Pulling Docker images..."
	if ! docker compose $compose_args pull --policy missing 2>/dev/null; then
		echo "Failed to pull Docker images. Some may need to be built."
		echo "Pulling non-buildable images..."
		docker compose $compose_args pull --ignore-buildable --policy missing
	else
		echo "All images pulled successfully."
	fi
}

# ------------------------------------------------------------------------------
#                                Run the script
# ------------------------------------------------------------------------------

if [ "$publish_json" = true ]; then
	export PUBLISH_TYPE="json"
elif [ "$publish_compile" = true ]; then
	export PUBLISH_TYPE="compile"
else
	echo "Must specify either JSON or compile option."
	show_help
	exit 1
fi

if [ "$publish_json" = true ] && [ "$publish_compile" = true ]; then
	echo "Cannot specify both JSON and compile options."
	show_help
	exit 1
fi

source $docker_dir/.env

# The publish type ("json" or "compile") are specified as environment variables
# to be used in the Dockerfile. We set them here before building the containers.
if [ "$PUBLISH_TYPE" = "json" ]; then
	echo "Publish type is set to JSON. Build the JSON payloads now and the container will use them to publish."
	# Ensure we're in the correct directory to run the Aptos CLI commands.
	cd $docker_dir || exit 1

	addr=$EMOJICOIN_MODULE_ADDRESS

	aptos move build-publish-payload \
	  --assume-yes \
	  --private-key $PUBLISHER_PK \
	  --encoding hex \
	  --named-addresses emojicoin_dot_fun=$addr \
	  --override-size-check \
	  --included-artifacts none \
	  --package-dir $move_dir/emojicoin_dot_fun/ \
	  --json-output-file $docker_dir/aptos-node/json/publish-emojicoin_dot_fun.json &

	aptos move build-publish-payload \
	  --assume-yes \
	  --private-key $PUBLISHER_PK \
	  --encoding hex \
	  --named-addresses rewards=$addr,integrator=$addr,emojicoin_dot_fun=$addr \
	  --override-size-check \
	  --included-artifacts none \
	  --package-dir $move_dir/rewards/ \
	  --json-output-file $docker_dir/aptos-node/json/publish-rewards.json
else
	echo "Publish type is set to compile- the container will build the contracts at run time."
fi

if [ "$reset" = true ]; then
	reset_container_resources
fi

if [ "$pull" = true ]; then
	pull_images
fi

if [ "$build" = true ]; then
	build_containers
fi

if [ "$start" = true ]; then
	start_containers
fi
