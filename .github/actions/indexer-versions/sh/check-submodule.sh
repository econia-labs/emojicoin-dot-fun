#!/bin/sh
set -e

# Get the current commit hash of the submodule.
SUBMODULE_DIR="src/rust/processor"
cd $SUBMODULE_DIR
SUBMODULE_COMMIT=$(cd "$PROCESSOR_DIR" && git rev-parse HEAD)
echo "Current submodule commit: $SUBMODULE_COMMIT"

# Check the commit expected based on the tag.
EXPECTED_TAG="emojicoin-process0r-v${PROCESSOR_VERSION}"
TAG_COMMIT=$(git rev-list -n 1 $EXPECTED_TAG)
if [ -z "$TAG_COMMIT" ]; then
	echo "::error::Tag $EXPECTED_TAG does not exist in processor repository"
	exit 1
fi