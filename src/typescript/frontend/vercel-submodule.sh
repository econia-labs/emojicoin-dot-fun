#!/bin/sh
TRADING_VIEW_SUBMODULE_PATH=public/static
if [ "$TRADING_VIEW_REPO_OWNER" == "" ]; then
	echo "Error: TRADING_VIEW_REPO_OWNER is empty. Set it in vercel."
	exit 1
fi
if [ "$GITHUB_ACCESS_TOKEN" == "" ]; then
	echo "Error: GITHUB_ACCESS_TOKEN is empty. Set it in vercel."
	exit 1
fi

# Exit on any error.
set -e

# Set up an empty temporary work directory.
rm -rf tmp || true
mkdir tmp
cd tmp

# Check out submodule.
git clone \
	https://$GITHUB_ACCESS_TOKEN@github.com/$TRADING_VIEW_REPO_OWNER/charting_library.git \
	--branch master \
	--depth 1

# Move files to submodule directory, clean up.
cd ..
mv tmp/charting_library/* $TRADING_VIEW_SUBMODULE_PATH/
rm -rf tmp
