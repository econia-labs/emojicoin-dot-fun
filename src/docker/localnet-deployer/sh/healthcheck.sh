#!/bin/bash

# Note that the response from the readiness endpoint at http://localhost:8070
# is a JSON object of the following structure:
#
# {
#   "ready": [
#       // Objects describing services that are ready.
#   ],
#   "not_ready": [
#       // Objects describing services that are not ready.
#   ]
# }
#
# `curl` the readiness endpoint and check if the `not_ready` array is empty.
# Pipe the output from `jq` to `grep` to check if the length is 0.

curl -s http://localhost:8070/ | jq -e '.not_ready | length == 0'

