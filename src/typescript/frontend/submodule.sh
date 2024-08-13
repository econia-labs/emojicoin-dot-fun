#!/bin/sh

TRADING_VIEW_SUBMODULE_PATH=public/static

# Exit on any error.
set -e

test -n "$TRADING_VIEW_REPO_OWNER" || ( \
	echo "Error: TRADING_VIEW_REPO_OWNER is empty. Please set it." && \
	exit 1 \
)

test -n "$TRADING_VIEW_REPO_ACCESS_TOKEN" || ( \
	echo "Error: TRADING_VIEW_REPO_ACCESS_TOKEN is empty. Please set it." && \
	exit 1 \
)

# Set up an empty temporary work directory.
rm -rf tmp || true
mkdir tmp
cd tmp

# Check out submodule.
git clone \
	https://$TRADING_VIEW_REPO_ACCESS_TOKEN@github.com/$TRADING_VIEW_REPO_OWNER/charting_library.git \
	--branch master \
	--depth 1

# Move files to submodule directory, clean up.
cd ..
mv tmp/charting_library/* $TRADING_VIEW_SUBMODULE_PATH/
rm -rf tmp
