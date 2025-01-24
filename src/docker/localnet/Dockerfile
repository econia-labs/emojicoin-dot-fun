# cspell:word localnet

FROM econialabs/aptos-cli:4.4.0

RUN apt-get update && apt-get install --no-install-recommends -y bc=1.07* \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY src/docker/localnet/*.sh sh/

RUN chmod +x sh/*.sh

ENTRYPOINT [ "/bin/sh", "sh/run-localnet.sh" ]

HEALTHCHECK                \
    --interval=5s          \
    --timeout=5s           \
    --start-period=30s     \
    --retries=5            \
    CMD sh/healthcheck.sh
