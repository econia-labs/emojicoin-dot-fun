<!-- cspell:word permissioned -->

# `emojicoin-dot-fun` favorites

This package contains functions to set, get and unset favorite markets per user.

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

## Set favorite

```sh
MARKET_ADDRESS=0xccc...
FAVORITES=0xaaa...
PROFILE_NAME=my-profile

aptos move run \
  --args address:$MARKET_ADDRESS \
  --function-id $FAVORITES::emojicoin_dot_fun_favorites::set_favorite \
  --profile $PROFILE_NAME
```

## Unset favorite

```sh
MARKET_ADDRESS=0xccc...
FAVORITES=0xaaa...
PROFILE_NAME=my-profile

aptos move run \
  --args address:$MARKET_ADDRESS \
  --function-id $FAVORITES::emojicoin_dot_fun_favorites::unset_favorite \
  --profile $PROFILE_NAME
```

## Get favorites

```sh
USER_ADDRESS=0xccc...
FAVORITES=0xaaa...
PROFILE_NAME=my-profile

aptos move view \
  --args address:$USER_ADDRESS \
  --function-id $FAVORITES::emojicoin_dot_fun_favorites::favorites \
  --profile $PROFILE_NAME
```
