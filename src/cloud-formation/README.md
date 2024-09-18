<!---
cspell:word getauthorizationtoken
cspell:word ec2instanceconnectcli
cspell:word eice
cspell:word pullthroughcache
-->

# Indexer on CloudFormation

The indexer can be automatically deployed on [AWS CloudFormation] with [GitSync]
using the [template file] at `indexer.cfn.yaml` and a development-specific
[stack deployment file] at `deploy-*.yaml`. Once a [stack] is configured
accordingly, `git` updates will result in automatic updates.

The indexer provides a public REST endpoint and a public WebSocket endpoint
under a root domain you provide, for an environment name of your choosing:

| Endpoint  | URI                                         | Hardening   |
| --------- | ------------------------------------------- | ----------- |
| REST      | `https://<ENVIRONMENT>.<YOUR_ROOT_DOMAIN>`  | API key     |
| WebSocket | `wss://ws.<ENVIRONMENT>.<YOUR_ROOT_DOMAIN>` | Forthcoming |

## Template parameters

`indexer.cfn.yaml` contains assorted [parameters] of the form `MaybeDeploy*`
that can be used to selectively provision and de-provision [resources]. For a
concise list of such parameters, see a [stack deployment file] at
`deploy-*.yaml`. See the template [conditions] section for associated
dependencies.

Note that even if a parameter is passed as `true`, the resources that directly
depend on it will not be created unless the condition's dependencies are also
met. All resources are eventually conditional on `MaybeDeployStack`, which can
be used to toggle provisioning and de-provisioning of all resources.

In practice this means that even if a `MaybeDeploy*` parameter is passed as
`true`, the corresponding resource(s) might not be created. For example if
`MaybeDeployStack` is `false`, then even if `MaybeDeployVpc` is `true`,
virtual private network resources won't be created because `MaybeDeployVpc`
is conditional on `MaybeDeployStack`.

In theory [rules] could be used to enforce parametric dependencies, thus
generating an error in the case that a hypothetical `DeployVpc` is passed
`true` but a hypothetical `DeployStack` is passed `false`, however rules have
several prohibitive issues in practice:

1. [`cfn-lint` issue #3630].

1. If a rule assertion fails, rather than reporting an assertion error, the
   [GitSync status dashboard] instead simply halts the update with
   [GitSync event] type `CHANGESET_CREATION_FAILED` and following event message,
   misleadingly reporting that no changes are present when in fact the update
   failure was a result of failed rule assertions:

   > Changeset creation failed. The reason was No updates are to be performed..

## Setup

1. [Make Route 53 the DNS service for a domain you own], which will
   automatically be configured with a subdomain for each deployment environment.

1. Create the following [Secrets Manager secrets]:

   <!-- markdownlint-disable MD033 -->

   <!--
   Markdown doesn't support in-row breaking, so use HTML and add an extra line
   in between tags as needed in order to use embedded Markdown syntax.
   -->

   <table><tr><th>
    Secret name
    </th><th>
    Description
    </th></tr><tr><td>

   `ecr-pullthroughcache/emojicoin/docker-hub`

   </td><td>

   See the `Docker Hub` section of [the upstream repository credentials docs].

   </td></tr><tr><td>

   `emojicoin/grpc-auth-token`

   </td><td>

   A plaintext API key for the [transaction stream service endpoint] you are
   connecting to, for example an
   [Aptos Labs transaction stream service API key].

   </td></tr></table>

1. Follow the `For Docker Hub` section of the
   [ECR pull through cache rule creation docs] using the secret
   `ecr-pullthroughcache/emojicoin/docker-hub` and prefix `emojicoin`.

   <!-- markdownlint-enable MD033 -->

1. Create the following [Systems Manager parameters] with
   [fully-qualified names][parameter naming constraints], using `kebab-case` for
   consistency with the naming requirements for the
   [Docker Hub secret][the upstream repository credentials docs]:

   <!-- markdownlint-disable MD033 -->

   <table><tr><th>
    Parameter name
    </th><th>
    Description
    </th></tr><tr><td>

   `/emojicoin/grpc-data-service-url/<mainnet|testnet>`

   </td><td>

   A [transaction stream service endpoint], for example the
   [Aptos Labs gRPC endpoint].

   </td></tr><tr><td>

   `/emojicoin/indexer-dns-name/hosted-zone-id`

   </td><td>

   The [hosted zone ID] for your domain.

   </td></tr><tr><td>

   `/emojicoin/indexer-dns-name/root-domain`

   </td><td>
   The root domain you own.

   </td></tr><tr><td>

   `/emojicoin/minimum-starting-version/<mainnet|testnet>`

   </td><td>
    A transaction version number prior to the version in which the target Move
    package was published.
    </td></tr><tr><td>

   `/emojicoin/package-address/<mainnet|testnet>`

   </td><td>
    The address of the Move package you want to index.
    </td></tr></table>

   <!-- markdownlint-enable MD033 -->

   > Substitute either `mainnet` or `testnet` for `<mainnet|testnet>` depending
   > on the network you want to index (create a parameter for each network if
   > you want to run deployments for both).

1. Create the following [IAM roles]:

   <!-- markdownlint-disable MD033 -->

   <table><tr><th>
    Role name
    </th><th>
    Description
    </th></tr><tr><td>

   `CloudFormationGitHubSync`

   </td><td>

   A [GitSync IAM role].

   </td></tr><tr><td>

   `CloudFormationPowerUser`

   </td><td>

   A [CloudFormation service role] with [PowerUserAccess] plus the below
   [inline policy] particular to the indexer.

   </td></tr></table><details><summary>Policy</summary>

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "iam:AddRoleToInstanceProfile",
           "iam:AttachRolePolicy",
           "iam:CreateInstanceProfile",
           "iam:CreateRole",
           "iam:DeleteInstanceProfile",
           "iam:DeleteRole",
           "iam:DeleteRolePolicy",
           "iam:DetachRolePolicy",
           "iam:GetRole",
           "iam:PutRolePolicy",
           "iam:RemoveRoleFromInstanceProfile",
           "iam:TagRole"
         ],
         "Resource": "*"
       },
       {
         "Effect": "Allow",
         "Action": [
           "iam:PassRole"
         ],
         "Resource": "arn:aws:iam::*:role/EmojicoinContainerRole*"
       }
     ]
   }
   ```

   </details>
   <!-- markdownlint-enable MD033 -->

1. Create a [stack deployment file] (see `deploy-*.yml`) with appropriate
   [template parameters](#template-parameters).

1. [Create the stack with GitSync].

## Querying endpoints

### Public endpoints

Once you have [deployed a stack](#setup), query the public endpoint for your
deployment environment:

1. Set your stack name:

   ```sh
   STACK_NAME=<STACK_NAME>
   echo $STACK_NAME
   ```

1. Get the REST API key ID:

   ```sh
   API_KEY_ID=$(aws cloudformation describe-stack-resources \
       --logical-resource-id RestApiKey \
       --output text \
       --query 'StackResources[0].PhysicalResourceId' \
       --stack-name $STACK_NAME \
   )
   echo $API_KEY_ID
   ```

1. Get the REST API key:

   ```sh
   API_KEY=$(aws apigateway get-api-key \
       --api-key $API_KEY_ID \
       --include-value \
       --output text \
       --query 'value'
   )
   echo $API_KEY
   ```

1. Get the endpoints specified in the [template outputs section]:

   ```sh
   REST_ENDPOINT=$(aws cloudformation describe-stacks \
       --output text \
       --query 'Stacks[0].Outputs[?OutputKey==`RestEndpoint`].OutputValue' \
       --stack-name $STACK_NAME
   )
   WS_ENDPOINT=$(aws cloudformation describe-stacks \
       --output text \
       --query 'Stacks[0].Outputs[?OutputKey==`WsEndpoint`].OutputValue' \
       --stack-name $STACK_NAME
   )
   echo $REST_ENDPOINT
   echo $WS_ENDPOINT
   ```

1. Wait until the DNS names have resolved:

   ```sh
   host $(echo $REST_ENDPOINT | sed 's|^.*//||')
   host $(echo $WS_ENDPOINT | sed 's|^.*//||')
   ```

1. Query the REST endpoint:

   ```sh
   curl -H "x-api-key: $API_KEY" \
       "$REST_ENDPOINT/processor_status?select=last_success_version"
   ```

1. Connect to the WebSocket endpoint:

   ```sh
   websocat $WS_ENDPOINT
   ```

1. Subscribe to all events:

   ```sh
   {}
   ```

### Bastion host connections

Before you try connecting to the bastion host, verify that the
`MaybeDeployBastionHost` [condition][conditions] evaluates to `true`. Note
too that if you have been provisioning and de-provisioning other resources, you
might want to de-provision then provision the bastion host before running the
below commands, in order to refresh the bastion host [user data] that stores the
URLs of other resources in the stack.

1. Install the [EC2 Instance Connect CLI]:

   ```sh
   pip install ec2instanceconnectcli
   ```

1. Connect to the bastion host over the [EC2 Instance Connect Endpoint] using
   your stack name, for example `emoji-dev`:

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

1. Start `psql`:

   ```sh
   psql $DB_URL
   ```

1. List the databases:

   ```sh
   \list
   ```

1. After exiting `psql`, to view WebSocket events published by the processor:

   ```sh
   websocat $PROCESSOR_WS_URL
   ```

1. Subscribe to all events:

   ```sh
   {}
   ```

1. Connect to the broker:

   ```sh
   websocat $BROKER_WS_URL
   ```

1. Subscribe to all events:

   ```sh
   {}
   ```

1. Query PostgREST:

   ```sh
   curl $POSTGREST_URL/processor_status?select=last_success_version && echo
   ```

1. Check PostgREST through the NLB:

   ```sh
   curl http://$NLB_DNS_NAME:3000/processor_status?select=last_success_version \
       && echo
   ```

## Design notes

### Database

The indexer database uses [Aurora PostgreSQL] on a
[Multi-AZ Aurora Serverless v2 cluster] with a
[primary (writer) instance][aurora clusters] and a fallback
[replica (reader) instance][aurora clusters] in
[dynamically-assigned][auto-selection of aurora az], separate
[Availability Zones][aurora availability zones] to ensure
[high availability][high availability for aurora] with
[fault tolerant replica promotion] and [autoscaling][aurora autoscaling].

### Permissions

The `ContainerRole` [ECS task execution IAM role] provides
[least-privilege permissions] required for
[using an ECR pull through cache][ecr pull through cache permissions],
[container logging][container logging permissions], and accessing
[deployment secrets](#setup), with a
[wildcard resource][iam policy resource element] for
[`ecr::GetAuthorizationToken`] only, since it does not
[specify an action for an individual resource][iam policy resource element].
It also includes the [AmazonEC2ContainerServiceAutoscaleRole], which is required
for [application autoscaling IAM access].

For ease of accessing the various services required to deploy the indexer,
[`CloudFormationPowerUser`](#setup) is more permissive, though notably it
restricts [role passing] to the `ContainerRole`.

### Endpoint hardening

The `Waf` [resource][resources] specifies a [Web Application Firewall] to
protect REST and WebSocket endpoints, using custom and [managed rules]. The
`EnableWafRules*` [template parameters](#template-parameters) can be used to
toggle [rule actions] between `Block` and `Count`.

See the [Web ACL traffic overview dashboards] to monitor rules.

[amazonec2containerserviceautoscalerole]: https://docs.aws.amazon.com/autoscaling/application/userguide/security-iam-awsmanpol.html#ecs-policy
[application autoscaling iam access]: https://docs.aws.amazon.com/autoscaling/application/userguide/security_iam_service-with-iam.html
[aptos labs grpc endpoint]: https://aptos.dev/en/build/indexer/txn-stream/aptos-hosted-txn-stream#endpoints
[aptos labs transaction stream service api key]: https://aptos.dev/en/build/indexer/txn-stream/aptos-hosted-txn-stream#authorization-via-api-key
[aurora autoscaling]: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.how-it-works.html#aurora-serverless-v2.how-it-works.scaling
[aurora availability zones]: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Concepts.RegionsAndAvailabilityZones.html
[aurora clusters]: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Overview.html
[aurora postgresql]: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.AuroraPostgreSQL.html
[auto-selection of aurora az]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-rds-dbinstance.html#cfn-rds-dbinstance-availabilityzone
[aws cloudformation]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html
[cloudformation service role]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-iam-servicerole.html
[conditions]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/conditions-section-structure.html
[container logging permissions]: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/using_awslogs.html#ec2-considerations
[create the stack with gitsync]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/git-sync-walkthrough.html
[ec2 instance connect cli]: https://github.com/aws/aws-ec2-instance-connect-cli
[ec2 instance connect endpoint]: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/connect-using-eice.html
[ecr pull through cache permissions]: https://docs.aws.amazon.com/AmazonECR/latest/userguide/pull-through-cache-iam.html
[ecr pull through cache rule creation docs]: https://docs.aws.amazon.com/AmazonECR/latest/userguide/pull-through-cache-creating-rule.html
[ecs task execution iam role]: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_execution_IAM_role.html
[fault tolerant replica promotion]: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Concepts.AuroraHighAvailability.html#Aurora.Managing.FaultTolerance
[gitsync]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/git-sync.html
[gitsync event]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/git-sync-status.html#git-sync-status-sync-events
[gitsync iam role]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/git-sync-prereq.html#git-sync-prereq-iam
[gitsync status dashboard]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/git-sync-status.html
[high availability for aurora]: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Concepts.AuroraHighAvailability.html
[hosted zone id]: https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/ListInfoOnHostedZone.html
[iam policy resource element]: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_resource.html
[iam roles]: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html
[inline policy]: https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_managed-vs-inline.html#inline-policies
[least-privilege permissions]: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html#grant-least-privilege
[make route 53 the dns service for a domain you own]: https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/migrate-dns-domain-in-use.html
[managed rules]: https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups-list.html
[multi-az aurora serverless v2 cluster]: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.how-it-works.html#aurora-serverless.ha
[parameter naming constraints]: https://docs.aws.amazon.com/systems-manager/latest/userguide/sysman-paramstore-su-create.html
[parameters]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/parameters-section-structure.html
[poweruseraccess]: https://docs.aws.amazon.com/aws-managed-policy/latest/reference/PowerUserAccess.html
[resources]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/resources-section-structure.html
[role passing]: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_passrole.html
[rule actions]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-wafv2-webacl-ruleaction.html
[rules]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/rules-section-structure.html
[secrets manager secrets]: https://docs.aws.amazon.com/secretsmanager/latest/userguide/create_secret.html
[stack]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/stacks.html
[stack deployment file]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/git-sync-concepts-terms.html#git-sync-concepts-terms-depoyment-file
[systems manager parameters]: https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html
[template file]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/gettingstarted.templatebasics.html
[template outputs section]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/outputs-section-structure.html
[the upstream repository credentials docs]: https://docs.aws.amazon.com/AmazonECR/latest/userguide/pull-through-cache-creating-secret.html
[transaction stream service endpoint]: https://aptos.dev/en/build/indexer/txn-stream
[user data]: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html
[web acl traffic overview dashboards]: https://docs.aws.amazon.com/waf/latest/developerguide/web-acl-dashboards.html
[web application firewall]: https://docs.aws.amazon.com/waf/latest/developerguide/waf-chapter.html
[`cfn-lint` issue #3630]: https://github.com/aws-cloudformation/cfn-lint/issues/3630
[`ecr::getauthorizationtoken`]: https://docs.aws.amazon.com/AmazonECR/latest/APIReference/API_GetAuthorizationToken.html
