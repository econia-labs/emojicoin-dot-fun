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
COPY --from=planner app/recipe.json recipe.json
RUN apt-get update && apt-get install -y --no-install-recommends \
    libudev-dev \
    build-essential \
    libclang-dev \
    libdw-dev \
    libpq-dev \
    libssl-dev \
    lld \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*
COPY . .
RUN cargo chef cook --bin broker --package broker --release

# Install runtime dependencies, copy over binary.
FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    libssl-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/broker /app

# This helps the container stop faster.
STOPSIGNAL SIGKILL

ENTRYPOINT ["/app/broker"]
