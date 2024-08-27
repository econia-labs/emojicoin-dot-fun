<!---
cspell:word ec2instanceconnectcli
cspell:word eice
-->

# Rust source

## `emojicoin-dot-fun` indexer

### Running Docker compose locally

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

### AWS CloudFormation

The indexer is deployed using [AWS CloudFormation] with a [template file] at
`cloud-formation/indexer.cfm.yaml` and a development-specific
[stack deployment file] at `cloud-formation/deploy-dev.yaml`.

By granting [PowerUserAccess] to the stack, deployments can be performed
programmatically using [GitSync] alone.

#### Connect to database through bastion host

Verify the `ProvisionBastionHost` [stack parameter][stack deployment file] is
set to `true`.

Install the [AWS EC2 Instance Connect CLI]:

```sh
pip install ec2instanceconnectcli
```

Set your stack name, for example `emojicoin-dot-fun-indexer-dev`:

```sh
STACK_NAME=emojicoin-dot-fun-indexer-dev
```

Get the bastion host instance ID from the CloudFormation stack:

```sh
INSTANCE_ID=$(aws cloudformation describe-stacks \
    --output text \
    --query 'Stacks[0].Outputs[?OutputKey==`BastionHostId`].OutputValue' \
    --stack-name $STACK_NAME
)
echo $INSTANCE_ID
```

Get the database cluster endpoint:

```sh
DB_CLUSTER_ENDPOINT=$(aws cloudformation describe-stacks \
    --output text \
    --query 'Stacks[0].Outputs[?OutputKey==`DbClusterEndpoint`].OutputValue' \
    --stack-name $STACK_NAME
)
echo $DB_CLUSTER_ENDPOINT
```

Connect to the instance via [EC2 Instance Connect Endpoint]:

```sh
aws ec2-instance-connect ssh \
    --instance-id $INSTANCE_ID --connection-type eice
```

Set the database cluster endpoint inside the VM:

```sh
DB_CLUSTER_ENDPOINT=
```

Start `psql`:

```sh
psql postgres://indexer:indexer@$DB_CLUSTER_ENDPOINT
```

Run a simple statement:

```sh
SELECT NOW();
```

[aws cloudformation]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html
[aws ec2 instance connect cli]: https://github.com/aws/aws-ec2-instance-connect-cli
[ec2 instance connect endpoint]: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/connect-using-eice.html
[gitsync]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/git-sync.html
[poweruseraccess]: https://docs.aws.amazon.com/aws-managed-policy/latest/reference/PowerUserAccess.html
[stack deployment file]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/git-sync-concepts-terms.html
[template file]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/gettingstarted.templatebasics.html
