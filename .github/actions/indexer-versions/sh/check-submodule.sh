#!/bin/sh
set -e

# Get the current commit hash of the submodule.
SUBMODULE_DIR="src/rust/processor"
cd $SUBMODULE_DIR
SUBMODULE_COMMIT=$(cd "$PROCESSOR_DIR" && git rev-parse HEAD)
echo "Current submodule commit: $SUBMODULE_COMMIT"
