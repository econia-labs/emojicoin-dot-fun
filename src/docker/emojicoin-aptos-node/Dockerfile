FROM econialabs/aptos-cli:4.1.0 AS aptos-cli

FROM ubuntu:noble AS state-generator
# Copy the executable to `/usr/local/bin` and add it to the PATH.
ENV PATH=/usr/local/bin:$PATH
COPY --from=aptos-cli /usr/local/bin/aptos /usr/local/bin

ARG PUBLISHER_PK \
    BIG_MONEY_GUY_PK
ENV PUBLISHER_PK=${PUBLISHER_PK} \
    BIG_MONEY_GUY_PK=${BIG_MONEY_GUY_PK}

WORKDIR /app

RUN apt-get update && apt-get install --no-install-recommends -y \
    curl=8.5* \
    jq=1.7* \
    && rm -rf /var/lib/apt/lists/*

ARG base_path=src/docker/emojicoin-aptos-node
COPY $base_path/json/publish-emojicoin_dot_fun.json json/
COPY $base_path/json/publish-rewards.json json/
COPY $base_path/json/test-accounts.json json/
COPY $base_path/sh/initialize-state.sh sh/

RUN chmod +x sh/initialize-state.sh

RUN ["bash", "sh/initialize-state.sh"]

FROM state-generator

# Copy the data from the state-generator to the final image.
# This includes the on-chain testnet data and the CLI profiles.
COPY --from=state-generator /app/.aptos/testnet /app/.aptos/testnet
COPY --from=state-generator /app/.aptos/config.yaml /app/.aptos/config.yaml

STOPSIGNAL SIGKILL

# Leave it open to the user to run the node with various options.
# Keep in mind that the `--force-restart` option will remove the
# testnet data directory and reinitialize the state.
