# `emojicoin-dot-fun` rewards

This package contains an overloaded version of the `swap` function for
`emojicoin-dot-fun`, `swap_with_rewards`, which gives users an opportunity for a
reward based on the amount of integrator fees they pay for their swap.

The rewards vault can be loaded up via the `fund_tiers` function.

Rewards distributions are random, and based on a probabilistic threshold
determined by the number of nominal rewards distributions expected for a given
nominal volume amount. See `reward_tiers` for more.

For ease of parameter modeling, named constants use values in `APT`, which are
converted to octas internally.

## Publish commands

Set variables:

```sh
EMOJICOIN_DOT_FUN=0xaaa...
INTEGRATOR=0xbbb...
REWARDS=0xccc...
PROFILE=my-profile
```

Publish:

```sh
NAMED_ADDRESSES=$(
    printf "%s,%s,%s" \
        "emojicoin_dot_fun=$EMOJICOIN_DOT_FUN" \
        "integrator=$INTEGRATOR" \
        "rewards=$REWARDS"
)
aptos move publish \
    --assume-yes \
    --named-addresses $NAMED_ADDRESSES \
    --profile $PROFILE
```

## Fund the vault

```sh
REWARDS=0xaaa...
PROFILE=my-profile
N_REWARDS_TO_FUND_PER_TIER="u64:[1500,500,200,50,5,1]"
```

```sh
aptos move run \
    --args $N_REWARDS_TO_FUND_PER_TIER \
    --function-id $REWARDS::emojicoin_dot_fun_rewards::fund_tiers \
    --profile $PROFILE
```
