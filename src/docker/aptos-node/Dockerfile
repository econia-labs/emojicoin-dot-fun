# cspell:word RUSTFLAGS

ARG GIT_REPO=https://github.com/aptos-labs/aptos-core.git
ARG GIT_TAG=aptos-cli-v4.0.0

ARG FULLNODE_BINARY=/aptos-core/target/cli/aptos

FROM rust:1-bookworm AS aptos-cli

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

# Resolve outdated lockfile from upstream tag, build the binary,
# and strip it to reduce its size.
RUN cargo update --manifest-path /aptos-core/Cargo.toml && \
    RUSTFLAGS="--cfg tokio_unstable" cargo build \
    --bin aptos \
    --manifest-path /aptos-core/Cargo.toml \
    --profile cli && \
    strip -s $FULLNODE_BINARY

FROM ubuntu AS base
WORKDIR /app

# Since we publish with json, we don't need to compile the Move contracts or
# install git, curl, etc.
# We just need to copy the json files. The actual build process is handled
# in `run-fullnode.sh`.
ARG PUBLISHER_PK \
    BIG_MONEY_GUY_PK
ENV PUBLISHER_PK=${PUBLISHER_PK} \
    BIG_MONEY_GUY_PK=${BIG_MONEY_GUY_PK}

COPY src/docker/aptos-node/json/publish-emojicoin_dot_fun.json json/
COPY src/docker/aptos-node/json/publish-rewards.json json/

RUN apt-get update && apt-get install --no-install-recommends -y \
    curl=8.5.0-2ubuntu10.3 \
    && rm -rf /var/lib/apt/lists/*

ENV PATH=/usr/local/bin:$PATH
ARG FULLNODE_BINARY

COPY --from=aptos-cli $FULLNODE_BINARY /usr/local/bin
COPY src/docker/aptos-node/json/batch-fund.json json/

COPY src/docker/aptos-node/healthcheck.sh .
COPY src/docker/aptos-node/run-fullnode.sh .

RUN chmod +x healthcheck.sh && \
    chmod +x run-fullnode.sh

STOPSIGNAL SIGKILL
