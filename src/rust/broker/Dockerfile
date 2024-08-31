ARG BUILDER_VERSION=1.0.0

# Configure base image with buildtime dependencies.
FROM econialabs/rust-builder:$BUILDER_VERSION AS base
WORKDIR /app

# Prepare build recipe.
FROM base AS planner
COPY . .
RUN cargo chef prepare --bin broker

# Cache build dependencies, compile binary.
FROM base AS builder
ARG FEATURES
RUN apt-get update && apt-get install -y --no-install-recommends \
    libudev-dev=252.26 \
    build-essential=12.9 \
    libclang-dev=1:14.0 \
    libpq-dev=15.8 \
    libssl-dev=3.0.13 \
    libdw-dev=0.188-2.1 \
    pkg-config=1.8.1 \
    lld=1:14.0 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=planner app/recipe.json recipe.json
RUN ls -la
COPY processor processor
RUN cargo chef cook \
    --bin broker \
    --features $FEATURES \
    --package broker \
    --release
COPY . .
RUN cargo build --bin broker --package broker --release --features $FEATURES

# Install runtime dependencies, copy over binary.
FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl=7.88.1 \
    libssl-dev=3.0.13 \
    libpq-dev=15.8 \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir app
COPY --from=builder /app/target/release/broker /app

# This helps the container stop faster.
STOPSIGNAL SIGKILL

ENTRYPOINT ["/app/broker"]
