#!/bin/sh
set -e

# Get broker and processor versions inside compose file.
COMPOSE_FILE="src/docker/compose.yaml"
COMPOSE_BROKER_IMAGE=$(yq '.services.broker.image' "$COMPOSE_FILE")
COMPOSE_PROCESSOR_IMAGE=$(yq '.services.processor.image' "$COMPOSE_FILE")
COMPOSE_BROKER_VERSION=$(echo "$COMPOSE_BROKER_IMAGE" | cut -d':' -f2)
COMPOSE_PROCESSOR_VERSION=$(echo "$COMPOSE_PROCESSOR_IMAGE" | cut -d':' -f2)

# Check if versions match.
echo "Docker Compose broker version: $COMPOSE_BROKER_VERSION"
if [ "$BROKER_VERSION" != "$COMPOSE_BROKER_VERSION" ]; then
	echo "::error::Does not match $BROKER_VERSION from deploy files"
	exit 1
fi
echo "Docker Compose processor version: $COMPOSE_PROCESSOR_VERSION"
if [ "$PROCESSOR_VERSION" != "$COMPOSE_PROCESSOR_VERSION" ]; then
	echo "::error::Does not match $PROCESSOR_VERSION from deploy files"
	exit 1
fi

echo "✅ Compose versions match"
