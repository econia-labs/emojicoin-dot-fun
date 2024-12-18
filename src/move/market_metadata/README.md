<!-- cspell:word permissioned -->

# `emojicoin-dot-fun` market metadata

This package contains functions to set and get metadata about markets in a
permissioned way.

## Publish commands

Set variables:

```sh
MARKET_METADATA=0xaaa...
EMOJICOIN_DOT_FUN=0xbbb...
PROFILE=my-profile
```

Publish:

```sh
NAMED_ADDRESSES=$(
    printf "%s,%s" \
        "market_metadata=$MARKET_METADATA" \
        "emojicoin_dot_fun=$EMOJICOIN_DOT_FUN"
)
aptos move publish \
    --assume-yes \
    --move-2 \
    --named-addresses $NAMED_ADDRESSES \
    --profile $PROFILE
```

## Add admin

```sh
NEW_ADMIN=0xccc...
MARKET_METADATA=0xaaa...
PROFILE_NAME=my-profile

aptos move run \
  --args address:$NEW_ADMIN \
  --function-id $MARKET_METADATA::emojicoin_dot_fun_market_metadata::add_admin \
  --profile $PROFILE_NAME
```

## Remove admin

```sh
ADMIN_TO_REMOVE=0xccc...
MARKET_METADATA=0xaaa...
PROFILE_NAME=my-profile

aptos move run \
  --args address:$ADMIN_TO_REMOVE \
  --function-id \
    $MARKET_METADATA::emojicoin_dot_fun_market_metadata::remove_admin \
  --profile $PROFILE_NAME
```

## Set property

```sh
MARKET_METADATA=0xaaa...
PROFILE=my-profile
PROPERTY=string:foo
VALUE=string:bar
MARKET_ID=u64:1
```

<!-- markdownlint-disable MD013 -->

```sh
aptos move run \
    --args $MARKET_ID $PROPERTY $VALUE \
    --function-id $MARKET_METADATA::emojicoin_dot_fun_market_metadata::add_market_property \
    --profile $PROFILE
```

## Unset property

```sh
aptos move run \
    --args $MARKET_ID $PROPERTY \
    --function-id $MARKET_METADATA::emojicoin_dot_fun_market_metadata::remove_market_property \
    --profile $PROFILE
```

<!-- markdownlint-enable MD013 -->
