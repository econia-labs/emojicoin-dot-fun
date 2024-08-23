FROM ubuntu

RUN apt-get update && apt-get install -y \
    python3 \
    wget \
    git \
    && rm -rf /var/lib/apt/lists/* \
    && wget -qO- "https://aptos.dev/scripts/install_cli.py" | python3

ARG EMOJICOIN_DOT_FUN_ROOT=src/move/emojicoin_dot_fun

WORKDIR /app/

COPY $EMOJICOIN_DOT_FUN_ROOT/Move.toml emojicoin_dot_fun/
COPY $EMOJICOIN_DOT_FUN_ROOT/sources/* emojicoin_dot_fun/sources/
COPY src/docker/move/start.sh .

ENV PATH=/root/.local/bin:$PATH

CMD ["bash", "/app/start.sh"]
