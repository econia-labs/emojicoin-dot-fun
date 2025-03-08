#!/bin/sh
set -e
COMPOSE_FILE="src/docker/comose.yaml"
COMPOSE_BROKER_VERSION=$(yq '.services.broker.image' "$COMPOSE_FILE")
COMPOSE_PROCESSOR_VERSION=$(yq '.services.processor.image' "$COMPOSE_FILE")
echo $COMPOSE_BROKER_VERSION
echo $COMPOSE_PROCESSOR_VERSION