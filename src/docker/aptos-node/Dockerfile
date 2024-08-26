# cspell:word RUSTFLAGS

ARG GIT_REPO=https://github.com/aptos-labs/aptos-core.git
ARG GIT_TAG=aptos-cli-v4.0.0

ARG FULLNODE_BINARY=/aptos-core/target/cli/aptos

FROM rust:1-bookworm AS compile-cli
ARG GIT_REPO
ARG GIT_TAG
ARG FULLNODE_BINARY

ENV CARGO_NET_GIT_FETCH_WITH_CLI=true

# To fix the `unexpected disconnect while reading sideband packet` error,
# we need to set the compression level to 9, the highest level, otherwise
# we run into issues with memory usage.
RUN git config --global core.compression 9

RUN git clone $GIT_REPO --branch $GIT_TAG --depth 1
RUN apt-get update && apt-get install -y \
    libudev-dev \
    build-essential \
    libclang-dev \
    libpq-dev \
    libssl-dev \
    libdw-dev \
    pkg-config \
    lld \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Resolve outdated lockfile from upstream tag.
RUN cargo update --manifest-path /aptos-core/Cargo.toml

RUN RUSTFLAGS="--cfg tokio_unstable" cargo build \
    --bin aptos \
    --manifest-path /aptos-core/Cargo.toml \
    --profile cli

RUN strip -s $FULLNODE_BINARY

FROM ubuntu
ARG FULLNODE_BINARY
COPY --from=compile-cli $FULLNODE_BINARY /usr/local/bin
RUN apt-get update && apt-get install -y \
    libssl-dev \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

ENV PATH=/usr/local/bin:$PATH

ARG EMOJICOIN_DOT_FUN_ROOT=src/move/emojicoin_dot_fun
ARG REWARDS_ROOT=src/move/rewards

WORKDIR /app

COPY $EMOJICOIN_DOT_FUN_ROOT/Move.toml emojicoin_dot_fun/
COPY $EMOJICOIN_DOT_FUN_ROOT/sources/* emojicoin_dot_fun/sources/
COPY $REWARDS_ROOT/Move.toml rewards/
COPY $REWARDS_ROOT/sources/* rewards/sources/
COPY src/docker/aptos-node/run-fullnode.sh .
COPY src/docker/aptos-node/initialize-contract.sh .
RUN chmod +x run-fullnode.sh
RUN chmod +x initialize-contract.sh

STOPSIGNAL SIGKILL
