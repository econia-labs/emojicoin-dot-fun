<!---
cspell:word ec2instanceconnectcli
cspell:word eice
-->

# `emojicoin-dot-fun` indexer

## AWS CloudFormation

The indexer is deployed using [AWS CloudFormation] with a [template file] at
`cloud-formation/indexer.cfm.yaml` and a development-specific
[stack deployment file] at `cloud-formation/deploy-dev.yaml`.

By granting [PowerUserAccess] to the stack, deployments can be performed
programmatically using [GitSync] alone.

## Connect to bastion host

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

Connect to the instance via [EC2 Instance Connect Endpoint]:

```sh
aws ec2-instance-connect ssh \
    --instance-id $INSTANCE_ID --connection-type eice
```

[aws cloudformation]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html
[aws ec2 instance connect cli]: https://github.com/aws/aws-ec2-instance-connect-cli
[ec2 instance connect endpoint]: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/connect-using-eice.html
[gitsync]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/git-sync.html
[poweruseraccess]: https://docs.aws.amazon.com/aws-managed-policy/latest/reference/PowerUserAccess.html
[stack deployment file]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/git-sync-concepts-terms.html
[template file]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/gettingstarted.templatebasics.html
