# cspell:word RUSTFLAGS

ARG GIT_REPO=https://github.com/aptos-labs/aptos-core.git
ARG GIT_TAG=aptos-cli-v4.0.0

ARG FULLNODE_BINARY=/aptos-core/target/cli/aptos

FROM rust:1-bookworm AS compile-cli
ARG GIT_REPO
ARG GIT_TAG
ARG FULLNODE_BINARY

ENV CARGO_NET_GIT_FETCH_WITH_CLI=true

RUN git clone $GIT_REPO --branch $GIT_TAG --depth 1 \
    && apt-get update && apt-get install --no-install-recommends -y \
        libudev-dev=252.26-1~deb12u2 \
        build-essential=12.9 \
        libclang-dev=1:14.0-55.7~deb12u1 \
        libpq-dev=15.8-0+deb12u1 \
        libssl-dev=3.0.13-1~deb12u1 \
        libdw-dev=0.188-2.1 \
        pkg-config=1.8.1-1 \
        lld=1:14.0-55.7~deb12u1 \
        curl=7.88.1-10+deb12u6 \
    && rm -rf /var/lib/apt/lists/*

# Resolve outdated lockfile from upstream tag.
RUN cargo update --manifest-path /aptos-core/Cargo.toml \
    && RUSTFLAGS="--cfg tokio_unstable" cargo build \
        --bin aptos \
        --manifest-path /aptos-core/Cargo.toml \
        --profile cli \
    && strip -s $FULLNODE_BINARY

FROM ubuntu:noble
ARG FULLNODE_BINARY
COPY --from=compile-cli $FULLNODE_BINARY /usr/local/bin
RUN apt-get update && apt-get install --no-install-recommends -y \
    libssl-dev=3.0.13-0ubuntu3.3 \
    git=1:2.43.0-1ubuntu7.1 \
    curl=8.5.0-2ubuntu10.3 \
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
RUN chmod +x run-fullnode.sh && chmod +x initialize-contract.sh

STOPSIGNAL SIGKILL
