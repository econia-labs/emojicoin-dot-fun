# Fallback graphql queries

In case our indexer isn't working or is down, we provide fallback queries
using the GraphQL endpoint.

This endpoint is automatically resolved based on the network type, relying on
the Aptos Labs hosted GraphQL endpoints or the local endpoint if running on
localhost.
