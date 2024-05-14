#!/bin/bash

# Remove existing robots.txt if it exists
if [ -f ../src/app/robots.txt ]; then
	rm ../src/app/public/robots.txt
fi

# Copy development robots.txt
cp robots/robots.dev.txt ../src/app/robots.txt

# Build the app
pnpm run build
