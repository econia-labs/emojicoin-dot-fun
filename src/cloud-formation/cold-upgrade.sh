if ! command -v yq > /dev/null 2>&1; then
    echo "Error: yq is not installed"
    exit 1
fi

FILES="
    deploy-indexer-alpha.yaml
    deploy-indexer-fallback.yaml
    deploy-indexer-production.yaml
"

EXPRESSION='.parameters.DeployAlb = strenv(value) |
  .parameters.DeployAlbDnsRecord = strenv(value) |
  .parameters.DeployBastionHost = strenv(value) |
  .parameters.DeployBroker = strenv(value) |
  .parameters.DeployContainers = strenv(value) |
  .parameters.DeployDb = strenv(value) |
  .parameters.DeployNlb = strenv(value) |
  .parameters.DeployNlbVpcLink = strenv(value) |
  .parameters.DeployPostgrest = strenv(value) |
  .parameters.DeployProcessor = strenv(value) |
  .parameters.DeployRestApi = strenv(value) |
  .parameters.DeployRestApiDnsRecord = strenv(value)'

case $1 in
    "kill") value="false" ;;
    "revive") value="true" ;;
    *)
        echo "Usage: $0 [kill|revive]"
        exit 1
        ;;
esac

for file in $FILES; do
    export value
    yq eval -i "$EXPRESSION" "$file"
    echo "..." >> "$file"
done
echo "Applicable deploy file parameters set to $value"