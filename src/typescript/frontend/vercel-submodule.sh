#!/bin/sh
SUBMODULE_GITHUB=github.com/tradingview/charting_library.git
SUBMODULE_PATH=public/static
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

# Initialize an empty repository and checkout the submodule.
git init
git remote add origin https://$GITHUB_ACCESS_TOKEN@$SUBMODULE_GITHUB
git fetch origin master
git checkout master

# Cleanup the repository and move the files to the submodule directory.
cd ..
rm -rf tmp/.git
ls
mv tmp/* $SUBMODULE_PATH/
rm -rf tmp
