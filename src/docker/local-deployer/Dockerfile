# This is the easiest and most portable way of getting the `yq` binary, since
# the `yq` releases on apt are outdated and technically deprecated.
FROM mikefarah/yq:4.44.3 AS yq

FROM econialabs/aptos-cli:4.1.0

COPY --from=yq /usr/bin/yq /usr/bin/yq

ARG PUBLISHER_PRIVATE_KEY
ENV PUBLISHER_PRIVATE_KEY=${PUBLISHER_PRIVATE_KEY}

# Ensure the publisher private key is set.
RUN test -n "${PUBLISHER_PRIVATE_KEY}"

WORKDIR /app

COPY src/move/emojicoin_dot_fun/sources/* move/emojicoin_dot_fun/sources/
COPY src/move/emojicoin_dot_fun/Move.toml move/emojicoin_dot_fun/Move.toml

COPY src/move/rewards/sources/* move/rewards/sources/
COPY src/move/rewards/Move.toml move/rewards/Move.toml

COPY src/docker/local-deployer/sh/* sh/
COPY src/docker/local-deployer/json/* json/
COPY src/sh/utils/colors.sh sh/colors.sh

RUN chmod +x sh/*.sh                    \
    && sh/init-profile.sh               \
    && sh/build-batch-fund-payloads.sh  \
    && sh/build-publish-payloads.sh

ENTRYPOINT [ "bash", "sh/entrypoint.sh" ]
