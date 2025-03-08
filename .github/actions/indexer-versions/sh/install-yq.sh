#!/bin/sh
set -e

# Install jq (required dependency for the Python yq).
sudo apt-get update
sudo apt-get install -y jq

# Install yq via pip.
pip install yq

# Verify installation.
yq --version
