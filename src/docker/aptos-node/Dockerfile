# cspell:word RUSTFLAGS

ARG GIT_REPO=https://github.com/aptos-labs/aptos-core.git
ARG GIT_TAG=aptos-cli-v4.0.0

ARG FULLNODE_BINARY=/aptos-core/target/cli/aptos

# Need to set this here so Docker doesn't complain about the dynamic image name
# used in the `FROM` directive for the final stage.
ARG PUBLISH_TYPE=${PUBLISH_TYPE:-compile}

FROM rust:1-bookworm AS aptos-cli

ARG GIT_REPO
ARG GIT_TAG
ARG FULLNODE_BINARY

ENV CARGO_NET_GIT_FETCH_WITH_CLI=true

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

FROM ubuntu AS base
WORKDIR /app

# If we publish with json, we don't need to compile the Move contracts or
# install git, curl, etc.
# We just need to copy the json files. The actual build process is handled
# in `run-fullnode.sh`.
FROM base AS publish-with-json
ARG PUBLISH_TYPE \
    PUBLISHER_PK \
    BIG_MONEY_GUY_PK
ENV PUBLISH_TYPE=${PUBLISH_TYPE} \
    PUBLISHER_PK=${PUBLISHER_PK} \
    BIG_MONEY_GUY_PK=${BIG_MONEY_GUY_PK}

ONBUILD COPY src/docker/aptos-node/json/publish-emojicoin_dot_fun.json json/
ONBUILD COPY src/docker/aptos-node/json/publish-rewards.json json/

# Otherwise, install the necessary dependencies to compile the Move contracts.
FROM base AS publish-with-compile
ARG PUBLISH_TYPE \
    PUBLISHER_PK \
    BIG_MONEY_GUY_PK
ENV PUBLISH_TYPE=${PUBLISH_TYPE} \
    PUBLISHER_PK=${PUBLISHER_PK} \
    BIG_MONEY_GUY_PK=${BIG_MONEY_GUY_PK}

ONBUILD RUN apt-get update && apt-get install -y \
    libssl-dev \
    git \
    && rm -rf /var/lib/apt/lists/*
ONBUILD COPY src/move/emojicoin_dot_fun/Move.toml emojicoin_dot_fun/
ONBUILD COPY src/move/emojicoin_dot_fun/sources/* emojicoin_dot_fun/sources/
ONBUILD COPY src/move/rewards/Move.toml rewards/
ONBUILD COPY src/move/rewards/sources/* rewards/sources/

FROM publish-with-${PUBLISH_TYPE} AS final
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*
ARG PUBLISH_TYPE \
    PUBLISHER_PK \
    BIG_MONEY_GUY_PK
ENV PUBLISH_TYPE=${PUBLISH_TYPE} \
    PUBLISHER_PK=${PUBLISHER_PK} \
    BIG_MONEY_GUY_PK=${BIG_MONEY_GUY_PK}

ENV PATH=/usr/local/bin:$PATH
ARG FULLNODE_BINARY
COPY --from=aptos-cli $FULLNODE_BINARY /usr/local/bin

COPY src/docker/aptos-node/json/batch-fund.json json/

COPY src/docker/aptos-node/run-fullnode.sh .
RUN chmod +x run-fullnode.sh

STOPSIGNAL SIGKILL
