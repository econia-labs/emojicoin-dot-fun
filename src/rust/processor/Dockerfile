ARG BUILDER_VERSION=1.2.0

# Configure base image with buildtime dependencies.
FROM econialabs/rust-builder:$BUILDER_VERSION AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential=12.9 \
    cmake=3.25* \
    curl=7.88* \
    clang=1:14* \
    pkg-config=1.8* \
    libdw-dev=0.188* \
    libpq-dev=15* \
    libssl-dev=3.0* \
    libjemalloc-dev=5.3* \
    lld=1:14* \
    && rm -rf /var/lib/apt/lists/*

# Plan build recipe for processor binary.
FROM base AS processor-planner
COPY . .
RUN cargo chef prepare --bin processor

# Cache crate dependencies, compile processor binary, pre-load migrations.
FROM base AS processor-builder
COPY --from=processor-planner app/recipe.json recipe.json
RUN cargo chef cook \
    --bin processor \
    --package processor \
    --release
COPY . .
# hadolint ignore=DL3003,DL4006
RUN cargo build --bin processor --package processor --release \
    && cp target/release/processor /usr/local/bin \
    && apt-get update && apt-get install -y --no-install-recommends \
        postgresql-common=248* \
        && rm -rf /var/lib/apt/lists/* \
    && yes | /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh \
    && apt-get update && apt-get install -y --no-install-recommends \
        postgresql-16=16* \
        postgresql-client-16=16* \
        && rm -rf /var/lib/apt/lists/* \
    && cargo install diesel_cli --no-default-features --features postgres \
    && mkdir /data \
    && chown postgres:postgres /data \
    && echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen \
    && locale-gen \
    && su - postgres -c "/usr/lib/postgresql/16/bin/initdb /data \
        --locale-provider=libc \
        --locale=en_US.UTF-8 \
        && /usr/lib/postgresql/16/bin/pg_ctl -D /data -l logfile start" \
    && su - postgres -c "/usr/lib/postgresql/16/bin/psql -c \
        \"CREATE ROLE emojicoin \
        ENCRYPTED PASSWORD 'emojicoin' \
        SUPERUSER CREATEDB CREATEROLE \
        INHERIT LOGIN;"\" \
    && cd processor/src/db/postgres \
    && sleep 5 \
    && diesel --database-url \
        postgres://emojicoin:emojicoin@localhost/emojicoin setup \
    && pg_dumpall -d \
        postgres://emojicoin:emojicoin@localhost/emojicoin > /db.sql

# Install runtime dependencies, copy over binaries.
FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt-get install --no-install-recommends -y \
    ca-certificates=* \
    net-tools=2.10* \
    tcpdump=4.99* \
    iproute2=6.1* \
    netcat-openbsd=1.219* \
    libdw-dev=0.188* \
    libpq-dev=15* \
    libssl-dev=3.0* \
    libssl3=3.0* \
    curl=7.88* \
    postgresql-client=15* \
    && rm -rf /var/lib/apt/lists/*
COPY --from=processor-builder /usr/local/bin/processor /usr/local/bin
COPY --from=processor-builder /db.sql /db.sql

# Configure logging format, executable startup script.
ENV RUST_LOG_FORMAT=json
WORKDIR /app
COPY ./processor/start.sh .
RUN chmod u+x /app/start.sh
WORKDIR /

# Expose health check port.
EXPOSE 8084

CMD ["/app/start.sh"]
