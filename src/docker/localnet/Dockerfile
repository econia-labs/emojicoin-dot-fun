# cspell:word localnet

FROM econialabs/aptos-cli:4.1.0

RUN apt-get update && apt-get install --no-install-recommends -y bc

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
