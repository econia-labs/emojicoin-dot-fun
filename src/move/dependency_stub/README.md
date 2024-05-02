# Dependency stub

This package stub is required to fulfill package dependency requirements during
publication within a transaction. To build the bytecode:

```sh
aptos move build-publish-payload \
    --json-output-file 0xc0de.json \
    --named-addresses stub=0xc0de
```
