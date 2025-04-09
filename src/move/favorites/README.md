# `emojicoin-dot-fun` favorites

This package contains functions to add, remove, and view favorite a user's
favorite emojicoin markets.

## Publish commands

Set variables:

```sh
FAVORITES=0xaaa...
EMOJICOIN_DOT_FUN=0xbbb...
PROFILE=my-profile
```

Publish:

```sh
NAMED_ADDRESSES=$(
    printf "%s,%s" \
        "favorites=$FAVORITES" \
        "emojicoin_dot_fun=$EMOJICOIN_DOT_FUN"
)
aptos move publish \
    --assume-yes \
    --move-2 \
    --named-addresses $NAMED_ADDRESSES \
    --profile $PROFILE
```

## Add favorite

```sh
# The market's flattened symbol emoji bytes. For example: 0xf09f8e83
SYMBOL_BYTES=0xf09f...
FAVORITES=0xaaa...
PROFILE=my-profile

aptos move run \
  --args hex:$SYMBOL_BYTES \
  --function-id $FAVORITES::emojicoin_dot_fun_favorites::add_favorite \
  --profile $PROFILE
```

## Remove favorite

```sh
# The market's flattened symbol emoji bytes. For example: 0xf09f8e83
SYMBOL_BYTES=0xf09f...
FAVORITES=0xaaa...
PROFILE=my-profile

aptos move run \
  --args hex:$SYMBOL_BYTES \
  --function-id $FAVORITES::emojicoin_dot_fun_favorites::remove_favorite \
  --profile $PROFILE
```

## View favorites

```sh
USER_ADDRESS=0xccc...
FAVORITES=0xaaa...
PROFILE=my-profile

aptos move view \
  --args address:$USER_ADDRESS \
  --function-id $FAVORITES::emojicoin_dot_fun_favorites::view_favorites \
  --profile $PROFILE
```
