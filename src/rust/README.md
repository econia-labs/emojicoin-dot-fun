# `emojicoin-dot-fun` indexer

## AWS CloudFormation

The indexer is deployed using [AWS CloudFormation] with a [template file] at
`cloud-formation/indexer.cfm.yaml` and a development-specific
[stack deployment file] at `cloud-formation/deploy-dev.yaml`.

By granting [PowerUserAccess] to the stack, deployments can be performed
programmatically using [GitSync] alone.

## Running Docker compose locally

1. Copy `example.env` to `.env`, which is ignored by `git`:

   ```sh
   cp example.env .env
   ```

1. Provide a `GRPC_AUTH_TOKEN` in your `.env` as described in `example.env`.

1. Modify other values as needed.

1. Start the indexer:

   ```sh
   docker compose up
   ```

[aws cloudformation]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html
[gitsync]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/git-sync.html
[poweruseraccess]: https://docs.aws.amazon.com/aws-managed-policy/latest/reference/PowerUserAccess.html
[stack deployment file]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/git-sync-concepts-terms.html
[template file]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/gettingstarted.templatebasics.html
