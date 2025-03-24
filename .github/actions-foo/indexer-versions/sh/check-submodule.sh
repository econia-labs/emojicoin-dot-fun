#!/bin/sh
set -e

# Get the current commit hash of the submodule.
SUBMODULE_DIR="src/rust/processor"
git submodule init $SUBMODULE_DIR
git submodule update $SUBMODULE_DIR
cd $SUBMODULE_DIR
SUBMODULE_COMMIT=$(cd "$PROCESSOR_DIR" && git rev-parse HEAD)

# Check the commit expected based on the tag.
git fetch --tags
EXPECTED_TAG="emojicoin-processor-v$PROCESSOR_VERSION"
TAG_COMMIT=$(git rev-list -n 1 $EXPECTED_TAG)
if [ -z "$TAG_COMMIT" ]; then
	echo "::error::Tag $EXPECTED_TAG does not exist in processor repository"
	exit 1
fi
echo "Expected submodule tag: $EXPECTED_TAG"
echo "Corresponding tag commit: $TAG_COMMIT"

# Compare the commits.
if [ "$SUBMODULE_COMMIT" != "$TAG_COMMIT" ]; then
	echo "::error::Processor submodule commit does not match the commit" \
		"for tag $EXPECTED_TAG"
	exit 1
fi

echo "✅ Submodule version matches"
