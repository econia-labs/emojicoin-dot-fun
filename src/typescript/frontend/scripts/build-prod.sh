#!/bin/bash

# Remove existing robots.txt if it exists
if [ -f ../src/app/robots.txt ]; then
	rm ../src/app/public/robots.txt
fi

# Copy production robots.txt
cp robots/robots.prod.txt ../src/app/robots.txt

# Build the app
pnpm run build
