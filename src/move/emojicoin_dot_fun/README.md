# emojicoin dot fun

This package is just within the bounds of max publication gas, and cost roughly
1 APT to publish during testing. To publish:

```sh
aptos move publish \
    --assume-yes \
    --included-artifacts=none \
    --max-gas 2000000 \
    --named-addresses emojicoin_dot_fun=$EMOJICOIN_DOT_FUN
```