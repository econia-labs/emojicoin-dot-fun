ARG APP_DIR=/app
ARG RUST_ROOT=.
ARG BIN_PATH=$APP_DIR/target/release/broker

FROM rust:slim-bookworm AS builder
ARG APP_DIR
ARG RUST_ROOT
COPY $RUST_ROOT $APP_DIR
WORKDIR $APP_DIR
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
RUN cargo build --all-features --release -p broker

FROM debian:bookworm-slim
ARG APP_DIR
ARG BIN_PATH

RUN apt-get update && apt-get install -y --no-install-recommends \
    libssl-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder $BIN_PATH $APP_DIR/

# This helps the container stop faster
STOPSIGNAL SIGKILL

ENTRYPOINT /app/broker
