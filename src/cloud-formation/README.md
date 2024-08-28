<!---
cspell:word ec2instanceconnectcli
cspell:word eice
-->

# Indexer on CloudFormation

The indexer can be automatically deployed on [AWS CloudFormation] with [GitSync]
using the [template file] at `indexer.cfn.yaml` and a development-specific
[stack deployment file] at `deploy-*.yaml`. Once a [stack] is configured
accordingly, `git` updates will result in automatic updates.

## Setup

1. [Make Route 53 the DNS service for a domain you own].

1. Set the following [Systems Manager parameters] (note `<Mainnet|Testnet>`
   should be substituted with either `Mainnet` or `Testnet`, depending on the
   network you want to index. You can create a parameter for each network if you
   want to run multiple deployments):

   1. `/Emojicoin/IndexerDnsName/HostedZoneId` (for your domain)
   1. `/Emojicoin/IndexerDnsName/RootDomain` (for your domain)
   1. `/Emojicoin/MinimumStartingVersion/<Mainnet|Testnet>`
   1. `/Emojicoin/ModuleAddress/<Mainnet|Testnet>`
   1. `/GrpcDataServiceUrl/<Mainnet|Testnet>`

1. Create the following [Secrets Manager secrets]:

   1. `GRPC_AUTH_TOKEN` (plaintext).
   1. `DOCKER_AUTH_CONFIG` (key/value pair below).

   ```json
   {
       "username": "<YOUR_USERNAME>",
       "password": "<YOUR_DOCKER_HUB_PERSONAL_ACCESS_TOKEN>"
   }
   ```

1. Configure a [GitSync IAM role], for example `CloudFormationGitHubSync`.

1. Configure a [CloudFormation service role], for example
   `CloudFormationPowerUser`, that has [PowerUserAccess] and the following
   [inline policy] particular to the indexer:

   <!-- markdownlint-disable MD033 -->

   <details>
    <summary>Inline policy</summary>

   <!-- markdownlint-enable MD033 -->

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "ecr:BatchCheckLayerAvailability",
           "ecr:BatchGetImage",
           "ecr:CreatePullThroughCacheRule",
           "ecr:DeletePullThroughCacheRule",
           "ecr:DescribePullThroughCacheRules",
           "ecr:GetDownloadUrlForLayer",
           "iam:AddRoleToInstanceProfile",
           "iam:AttachRolePolicy",
           "iam:CreateInstanceProfile",
           "iam:CreateRole",
           "iam:DeleteInstanceProfile",
           "iam:DeleteRole",
           "iam:DeleteRolePolicy",
           "iam:DetachRolePolicy",
           "iam:GetRole",
           "iam:PassRole",
           "iam:PutRolePolicy",
           "iam:RemoveRoleFromInstanceProfile",
           "iam:TagRole",
           "logs:CreateLogStream",
           "logs:PutLogEvents"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

   </details>

1. [Create the stack with GitSync].

## Template parameters

`indexer.cfn.yaml` contains assorted [parameters] of the form `TryProvision*`
that can be used to selectively provision and de-provision [resources]. For a
concise list of such parameters, see a [stack deployment file]. See the template
[conditions] section for associated dependencies.

Note that even if a parameter is passed as `true`, the resources that directly
depend on it will not be created unless the condition's dependencies are also
met. All resources are eventually conditional on `TryProvisionStack`, which can
be used to toggle provisioning and de-provisioning of all resources.

In practice this means that even if a `TryProvision*` parameter is passed as
`true`, the corresponding resource(s) might not be created. For example if
`TryProvisionStack` is `false`, then even if `TryProvisionVpc` is `true`,
virtual private network resources won't be created because `TryProvisionVpc`
is conditional on `TryProvisionStack`.

In theory [rules] could be used to enforce parametric dependencies, thus
generating an error in the case that `ProvisionVpc` is passed `true` but
`ProvisionStack` is passed `false`, however rules have several prohibitive
issues in practice:

1. [`cfn-lint` issue #3630].

1. If a rule assertion fails, rather than reporting an assertion error, the
   [GitSync status dashboard] instead simply halts the update with
   [GitSync event] type `CHANGESET_CREATION_FAILED` and following event message,
   misleadingly reporting that no changes are present when in fact the update
   failure was a result of failed rule assertions:

   > Changeset creation failed. The reason was No updates are to be performed..

## Database architecture

The indexer database uses [Aurora PostgreSQL] on a
[Multi-AZ Aurora Serverless v2 cluster] with a
[primary (writer) instance][aurora clusters] and a fallback
[replica (reader) instance][aurora clusters] in
[dynamically-assigned][auto-selection of aurora az], separate
[Availability Zones][aurora availability zones] to ensure
[high availability][high availability for aurora] with
[fault tolerant replica promotion] and [autoscaling][aurora autoscaling].

## Connect to services through bastion host

Before you try connecting to the bastion host, verify that the
`TryProvisionBastionHost` [condition][conditions] evaluates to `true`. Note too
that if you have been provisioning and de-provisioning other resources, you
might want to de-provision then provision the bastion host before running the
below commands, in order to refresh the bastion host [user data] that stores the
URLs of other resources in the stack.

Install the [EC2 Instance Connect CLI]:

```sh
pip install ec2instanceconnectcli
```

Connect to the bastion host over the [EC2 Instance Connect Endpoint] using your
stack name, for example `emoji-dev`:

```sh
STACK_NAME=emoji-dev
INSTANCE_ID=$(aws cloudformation describe-stacks \
    --output text \
    --query 'Stacks[0].Outputs[?OutputKey==`BastionHostId`].OutputValue' \
    --stack-name $STACK_NAME
)
if [ -n "$(echo -e "${INSTANCE_ID}" | tr -d '[:space:]')" ]; then
  echo "Connecting to instance ${INSTANCE_ID}"
  aws ec2-instance-connect ssh \
    --instance-id $INSTANCE_ID --connection-type eice
else
  echo 'Error: instance ID not found or is empty.' >&2
fi
```

Start `psql`:

```sh
psql $DB_URL
```

List the databases:

```sh
\list
```

After exiting `psql`, to view WebSocket events published by the processor:

```sh
websocat $PROCESSOR_WS_URL
```

Connect to the broker:

```sh
websocat $BROKER_WS_URL
```

Subscribe to all events:

```sh
{}
```

Query PostgREST:

```sh
curl $POSTGREST_URL/market_latest_state_event?select=market_id && echo
```

## Query public endpoints

If all of the bastion host tests work, you should be able to query the public
endpoint. Get the indexer DNS name:

```sh
DNS_NAME=$(aws cloudformation describe-stacks \
    --output text \
    --query 'Stacks[0].Outputs[?OutputKey==`DnsName`].OutputValue' \
    --stack-name $STACK_NAME
)
echo $DNS_NAME
```

Wait until the DNS name has resolved:

```sh
host $DNS_NAME
```

Connect to the WebSocket endpoint:

```sh
websocat wss://$DNS_NAME/ws
```

Subscribe to all events:

```sh
{}
```

Check PostgREST:

```sh
curl "https://$DNS_NAME/processor_status?select=last_success_version"
```

[aurora autoscaling]: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.how-it-works.html#aurora-serverless-v2.how-it-works.scaling
[aurora availability zones]: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Concepts.RegionsAndAvailabilityZones.html
[aurora clusters]: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Overview.html
[aurora postgresql]: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.AuroraPostgreSQL.html
[auto-selection of aurora az]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-rds-dbinstance.html#cfn-rds-dbinstance-availabilityzone
[aws cloudformation]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html
[cloudformation service role]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-iam-servicerole.html
[conditions]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/conditions-section-structure.html
[create the stack with gitsync]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/git-sync-walkthrough.html
[ec2 instance connect cli]: https://github.com/aws/aws-ec2-instance-connect-cli
[ec2 instance connect endpoint]: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/connect-using-eice.html
[fault tolerant replica promotion]: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Concepts.AuroraHighAvailability.html#Aurora.Managing.FaultTolerance
[gitsync]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/git-sync.html
[gitsync event]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/git-sync-status.html#git-sync-status-sync-events
[gitsync iam role]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/git-sync-prereq.html#git-sync-prereq-iam
[gitsync status dashboard]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/git-sync-status.html
[high availability for aurora]: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Concepts.AuroraHighAvailability.html
[inline policy]: https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_managed-vs-inline.html#inline-policies
[make route 53 the dns service for a domain you own]: https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/migrate-dns-domain-in-use.html
[multi-az aurora serverless v2 cluster]: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.how-it-works.html#aurora-serverless.ha
[parameters]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/parameters-section-structure.html
[poweruseraccess]: https://docs.aws.amazon.com/aws-managed-policy/latest/reference/PowerUserAccess.html
[resources]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/resources-section-structure.html
[rules]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/rules-section-structure.html
[secrets manager secrets]: https://docs.aws.amazon.com/secretsmanager/latest/userguide/create_secret.html
[stack]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/stacks.html
[stack deployment file]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/git-sync-concepts-terms.html#git-sync-concepts-terms-depoyment-file
[systems manager parameters]: https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html
[template file]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/gettingstarted.templatebasics.html
[user data]: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html
[`cfn-lint` issue #3630]: https://github.com/aws-cloudformation/cfn-lint/issues/3630
