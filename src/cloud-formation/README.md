<!---
cspell:word ec2instanceconnectcli
cspell:word eice
-->

# Indexer on CloudFormation

The indexer can be deployed on [AWS CloudFormation] using the [template file] at
`indexer.cfn.yaml` and a development-specific [stack deployment file] at
`deploy-*.yaml`.

## Configuration

Deployments can be performed programmatically using [GitSync] alone, through the
the use of a custom [IAM role] (for example `CloudFormationPowerUser`) that has
access to the [stack]. This custom role will require [PowerUserAccess] with the
following [inline policy]:

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
        "iam:CreateRole",
        "iam:TagRole",
        "iam:PassRole",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:RemoveRoleFromInstanceProfile",
        "iam:CreateInstanceProfile",
        "iam:DeleteInstanceProfile",
        "iam:AddRoleToInstanceProfile"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:BatchCheckLayerAvailability",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

</details>

Assuming you have [made AWS Route 53 the DNS service for a domain you own],
you'll need to set the following [AWS Systems Manager parameters]:

- `/Emojicoin/IndexerDnsName/HostedZoneId` (for your domain)
- `/Emojicoin/IndexerDnsName/RootDomain` (for your domain)
- `/Emojicoin/MinimumStartingVersion/<NETWORK>`
- `/Emojicoin/ModuleAddress/<NETWORK>`
- `/GrpcDataServiceUrl/<NETWORK>`

For `<NETWORK>` you can substitute `Mainnet` or `Testnet`, corresponding to the
`Network` template parameter. You'll also need the following secrets:

- `GRPC_AUTH_TOKEN` (plaintext)

- `DOCKER_AUTH_CONFIG` with format:

  ```json
  {
    "username": "<YOUR_USERNAME>",
    "password": "<YOUR_DOCKER_HUB_PERSONAL_ACCESS_TOKEN>"
  }
  ```

## Template parameters

`indexer.cfn.yaml` contains assorted [parameters] of the form `Provision*` that
can be used to selectively provision and de-provision [resources]. For a concise
list of such parameters, see the [stack deployment file]. See the template
[conditions] section for associated dependencies.

Note that even if a parameter is passed as `true`, the resources that directly
depend on it will not be created unless the condition's dependencies are also
met. All resources are eventually conditional on `ProvisionStack`, which can be
used to toggle provisioning and de-provisioning of all resources in the stack.

## Connect to services through bastion host

Before you try connecting to the bastion host, verify that the
`ProvisionBastionHost` [condition][conditions] evaluates to `true`. Note too
that if you have been provisioning and de-provisioning other resources, you
might want to de-provision then provision the bastion host before running the
below commands, in order to refresh the bastion host [user data] that stores the
URLs of other resources in the stack.

Install the [AWS EC2 Instance Connect CLI]:

```sh
pip install ec2instanceconnectcli
```

connect to the bastion host over the [EC2 Instance Connect Endpoint] using your
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

[aws cloudformation]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html
[aws ec2 instance connect cli]: https://github.com/aws/aws-ec2-instance-connect-cli
[aws systems manager parameters]: https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html
[conditions]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/conditions-section-structure.html
[ec2 instance connect endpoint]: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/connect-using-eice.html
[gitsync]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/git-sync.html
[iam role]: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html
[inline policy]: https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_managed-vs-inline.html#inline-policies
[made aws route 53 the dns service for a domain you own]: https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/migrate-dns-domain-in-use.html
[parameters]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/parameters-section-structure.html
[poweruseraccess]: https://docs.aws.amazon.com/aws-managed-policy/latest/reference/PowerUserAccess.html
[resources]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/resources-section-structure.html
[stack]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/stacks.html
[stack deployment file]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/git-sync-concepts-terms.html
[template file]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/gettingstarted.templatebasics.html
[user data]: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html
