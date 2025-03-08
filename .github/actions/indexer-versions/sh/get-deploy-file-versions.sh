#!/bin/sh
set -e

# Ensure file exists.
DEPLOY_FILE="src/cloud-formation/deploy-indexer-${DEPLOY_FILE_SUFFIX}.yaml"
echo "Loading values from: ${DEPLOY_FILE}"
if [ ! -f "${DEPLOY_FILE}" ]; then
  echo "Error: File not found: ${DEPLOY_FILE}"
  exit 1
fi

# Get binary versions.
BROKER_VERSION=$(yq eval '.parameters.BrokerImageVersion' "${DEPLOY_FILE}")
PROCESSOR_VERSION=$(
    yq eval '.parameters.ProcessorImageVersion' "${DEPLOY_FILE}"
)

# Set GitHub Actions output variables.
echo "BROKER_VERSION=${BROKER_VERSION}" >> $GITHUB_OUTPUT
echo "PROCESSOR_VERSION=${PROCESSOR_VERSION}" >> $GITHUB_OUTPUT
echo "Successfully loaded versions from ${DEPLOY_FILE}:"
echo "  Broker Version: ${BROKER_VERSION}"
echo "  Processor Version: ${PROCESSOR_VERSION}"