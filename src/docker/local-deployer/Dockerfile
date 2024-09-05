FROM econialabs/aptos-cli:4.1.0 AS aptos-cli

ARG PUBLISHER_PRIVATE_KEY \
    EMOJICOIN_MODULE_ADDRESS
ENV PUBLISHER_PRIVATE_KEY=${PUBLISHER_PRIVATE_KEY} \
    EMOJICOIN_MODULE_ADDRESS=${EMOJICOIN_MODULE_ADDRESS}

WORKDIR /app

ARG emojicoin_dir=src/move/emojicoin_dot_fun
ARG rewards_dir=src/move/rewards
COPY ${emojicoin_dir} move/emojicoin_dot_fun
COPY ${rewards_dir} move/rewards
RUN rm -rf move/emojicoin_dot_fun/build move/rewards/build

ARG host_base=src/docker/local-deployer
COPY ${host_base}/sh sh
COPY ${host_base}/json json

RUN chmod +x sh/build-publish-payloads.sh \
    && chmod +x sh/build-batch-fund-payloads.sh \
    && sh/build-batch-fund-payloads.sh \
    && sh/build-publish-payloads.sh

ENTRYPOINT [ "bash", "sh/entrypoint.sh" ]
