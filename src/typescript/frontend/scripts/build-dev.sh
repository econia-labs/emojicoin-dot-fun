#!/bin/bash

# Remove existing robots.txt if it exists
if [ -f public/robots.txt ]; then
    rm public/robots.txt
fi

# Copy development robots.txt
cp public/robots.dev.txt public/robots.txt

# Build the app
npm run build
