#!/bin/bash

# Remove existing robots.txt if it exists
if [ -f public/robots.txt ]; then
    rm public/robots.txt
fi

# Copy production robots.txt
cp public/robots.prod.txt public/robots.txt

# Build the app
npm run build
