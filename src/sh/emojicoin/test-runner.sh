#!/bin/bash
# cspell:word toplevel

# ------------------------------------------------------------------------------
#                            Setup for absolute paths
# ------------------------------------------------------------------------------
# Resolve the docker directory to its absolute path to avoid issues.
ROOT_DIR=$(git rev-parse --show-toplevel)
DOCKER_ABSOLUTE_DIR="$ROOT_DIR/src/docker"
EMOJICOIN_SCRIPTS_ABSOLUTE_DIR="$ROOT_DIR/src/sh/emojicoin"

cd "$DOCKER_ABSOLUTE_DIR" || exit 1

# Store the original working directory to return to upon exit.
original_cwd=$(pwd)

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
    echo "  -r, --reset       Reset all containers and volumes, including the local testnet."
    echo "  -s, --start       Start the Docker environment with the local testnet."
    echo "  --no-frontend     Do not start the frontend container."
    echo
    echo "  -h, --help        Display this help message"
    echo
    echo "You can specify both options to reset and then start the environment."
}

# ------------------------------------------------------------------------------
#                          Parse command line arguments
# ------------------------------------------------------------------------------

reset=false
start=false
include_frontend=true
show_help=false
localnode="local-testnet-postgres"
graphql="local-testnet-indexer-api"

base_compose="base.yaml"
localnode_compose="localnode.yaml"
frontend_compose="frontend.yaml"

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --reset) reset=true ;;
        -r) reset=true ;;
        --start) start=true ;;
        -s) start=true ;;
        --no-frontend) include_frontend=false ;;
        -h|--help) show_help; exit 0 ;;
        *) echo "Unknown parameter passed: $1"; show_help; exit 1 ;;
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

build_and_start() {
    echo "Starting local testnet..."
    docker compose $compose_args up --build -d --force-recreate
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

if [ "$reset" = true ]; then
    reset_container_resources
fi

pull_images

if [ "$start" = true ]; then
    build_and_start
fi
