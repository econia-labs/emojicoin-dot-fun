FROM node:20.12.2

SHELL ["/bin/bash", "-o", "pipefail"]

RUN ["bash", "-c", "curl -fsSL https://get.pnpm.io/install.sh | ENV=$HOME/.bashrc SHELL=$(which bash) bash -"]

RUN ["mv", "/root/.local/share/pnpm/pnpm", "/usr/local/bin"]

COPY . /

WORKDIR /src/typescript/frontend

ARG HASH_SEED \
    NEXT_PUBLIC_APTOS_NETWORK \
    NEXT_PUBLIC_INTEGRATOR_ADDRESS \
    NEXT_PUBLIC_INTEGRATOR_FEE_RATE_BPS \
    NEXT_PUBLIC_IS_ALLOWLIST_ENABLED \
    NEXT_PUBLIC_MODULE_ADDRESS \
    NEXT_PUBLIC_REWARDS_MODULE_ADDRESS \
    NEXT_PUBLIC_BROKER_URL \
    REVALIDATION_TIME \
    EMOJICOIN_INDEXER_URL \
    EMOJICOIN_INDEXER_API_KEY
ENV HASH_SEED=$HASH_SEED \
    NEXT_PUBLIC_APTOS_NETWORK=$NEXT_PUBLIC_APTOS_NETWORK \
    NEXT_PUBLIC_INTEGRATOR_ADDRESS=$NEXT_PUBLIC_INTEGRATOR_ADDRESS \
    NEXT_PUBLIC_INTEGRATOR_FEE_RATE_BPS=$NEXT_PUBLIC_INTEGRATOR_FEE_RATE_BPS \
    NEXT_PUBLIC_IS_ALLOWLIST_ENABLED=$NEXT_PUBLIC_IS_ALLOWLIST_ENABLED \
    NEXT_PUBLIC_MODULE_ADDRESS=$NEXT_PUBLIC_MODULE_ADDRESS \
    NEXT_PUBLIC_REWARDS_MODULE_ADDRESS=$NEXT_PUBLIC_REWARDS_MODULE_ADDRESS \
    NEXT_PUBLIC_BROKER_URL=$NEXT_PUBLIC_BROKER_URL \
    REVALIDATION_TIME=$REVALIDATION_TIME \
    EMOJICOIN_INDEXER_URL=$EMOJICOIN_INDEXER_URL \
    EMOJICOIN_INDEXER_API_KEY=${EMOJICOIN_INDEXER_API_KEY}

RUN ["bash", "-c", "pnpm install && pnpm run build"]

CMD ["pnpm", "run", "start", "-H", "0.0.0.0"]
