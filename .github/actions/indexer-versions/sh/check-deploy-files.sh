#!/bin/sh
set -e

# Check if a file exists.
check_file_exists() {
	local file_path="$1"
	if [ ! -f "$file_path" ]; then
		echo "::error::File not found: $file_path"
		exit 1
	fi
}

# Check the `Environment` value for a deploy file.
check_environment() {
	local file_path="$1"
	local expected_env="$2"
	local actual_env=$(yq '.parameters.Environment' "$file_path")
	if [ "$actual_env" != "$expected_env" ]; then
		echo "::error::Environment in $file_path is '$actual_env'"
		exit 1
	fi
}

# Define file paths.
DEPLOY_FILE_PREFIX="src/cloud-formation/deploy-indexer-"
DEPLOY_FILE_FALLBACK="${DEPLOY_FILE_PREFIX}fallback.yaml"
DEPLOY_FILE_PRODUCTION="${DEPLOY_FILE_PREFIX}production.yaml"

# Check if files exist.
check_file_exists "$DEPLOY_FILE_FALLBACK"
check_file_exists "$DEPLOY_FILE_PRODUCTION"

# Verify `Environment` in both files.
check_environment "$DEPLOY_FILE_FALLBACK" "fallback"
check_environment "$DEPLOY_FILE_PRODUCTION" "production"

# Create temporary files.
TEMP_FALLBACK=$(mktemp)
TEMP_PRODUCTION=$(mktemp)

# Extract data without `Environment` field.
yq 'del(.parameters.Environment)' "$DEPLOY_FILE_FALLBACK" >"$TEMP_FALLBACK"
yq 'del(.parameters.Environment)' "$DEPLOY_FILE_PRODUCTION" >"$TEMP_PRODUCTION"

# Compare the results.
if ! diff "$TEMP_FALLBACK" "$TEMP_PRODUCTION" >/dev/null; then
	# Clean up temporary files.
	rm -f "$TEMP_FALLBACK" "$TEMP_PRODUCTION"
	echo "::error::Fallback and production files mismatched"
	exit 1
fi

# Clean up temporary files.
rm -f "$TEMP_FALLBACK" "$TEMP_PRODUCTION"

# Get binary versions.
BROKER_VERSION=$(
	yq eval '.parameters.BrokerImageVersion' "${DEPLOY_FILE_PRODUCTION}"
)
PROCESSOR_VERSION=$(
	yq eval '.parameters.ProcessorImageVersion' "${DEPLOY_FILE_PRODUCTION}"
)

# Set GitHub Actions output variables.
echo "BROKER_VERSION=${BROKER_VERSION}" >>$GITHUB_OUTPUT
echo "PROCESSOR_VERSION=${PROCESSOR_VERSION}" >>$GITHUB_OUTPUT
echo "Successfully checked deploy files with versions:"
echo "  Broker: ${BROKER_VERSION}"
echo "  Processor: ${PROCESSOR_VERSION}"
