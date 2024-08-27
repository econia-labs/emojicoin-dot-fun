<!---
cspell:word ec2instanceconnectcli
cspell:word eice
-->

# Indexer on CloudFormation

The indexer can be deployed on [AWS CloudFormation] using the [template file] at
`indexer.cfn.yaml` and a development-specific [stack deployment file] at
`deploy-*.yaml`.

By granting [PowerUserAccess] to the [stack], deployments can be performed
programmatically using [GitSync] alone.

## Parameters

### Configurable provisioning

`indexer.cfn.yaml` contains assorted [parameters] of the form `Provision*` that
can be used to selectively provision and de-provision [resources]. For a concise
list of such parameters, see the [stack deployment file]. See the template
[conditions] section for associated dependencies.

Note that even if a parameter is passed as `true`, the resources that directly
depend on it will not be created unless the condition's dependencies are also
met. All resources are eventually conditional on `ProvisionStack`, which can be
used to toggle provisioning and de-provisioning of all resources in the stack.

## Connect to services through bastion host

Install the [AWS EC2 Instance Connect CLI]:

```sh
pip install ec2instanceconnectcli
```

Assuming the `ProvisionBastionHost` [condition][conditions] evaluates to `true`,
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
curl https://$DNS_NAME/
```

[aws cloudformation]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html
[aws ec2 instance connect cli]: https://github.com/aws/aws-ec2-instance-connect-cli
[ec2 instance connect endpoint]: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/connect-using-eice.html
[gitsync]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/git-sync.html
[poweruseraccess]: https://docs.aws.amazon.com/aws-managed-policy/latest/reference/PowerUserAccess.html
[stack deployment file]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/git-sync-concepts-terms.html
[template file]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/gettingstarted.templatebasics.html
[parameters]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/parameters-section-structure.html
[resources]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/resources-section-structure.html
[conditions]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/conditions-section-structure.html
[stack]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/stacks.html