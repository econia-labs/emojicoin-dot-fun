FROM econialabs/aptos-cli:4.1.0

ARG FORCE_RESTART
ENV FORCE_RESTART=$FORCE_RESTART

COPY src/docker/localnet/*.sh sh/

RUN chmod +x sh/*.sh

ENTRYPOINT [ "bash", "sh/run-localnet.sh" ]
