# Serverless Plugin Apollo Graphql Federation

A serverless plugin that uploads graphql schemas to Apollo managed federation. This plugin should be used in implementing services. This allows the gateway service to pull schema from apollo managed federation and also stops implementing services from uploading invalid schemas that would cause the gateway to fail.

See <https://www.apollographql.com/docs/federation/managed-federation/setup/> for more information about `Managed Federation`.

## Usage

### Install with `npm`

```sh
npm i -D serverless-plugin-apollo-graphql-federation
```

### Add to `serverless.yml`

```yml
plugins:
  - serverless-plugin-apollo-graphql-federation
```

```yml
service:
  custom:
    apolloGraphQLFederation:
      uploadForDeploymentRegion: eu-west-2
      graphs:
        - name: myGraph
          key: apollo-api-key-for-my-graph
          variant: dev
          services:
            - name: products
              schema: ./products.schema.graphql
              url: http://products-graphql.svc.cluster.local:4001
            - name: reviews
              schema: ./reviews.schema.graphql
              url: http://reviews-graphql.svc.cluster.local:4001
```

`uploadForDeploymentRegion` (optional) is used for multi-region deployments where the same api is deployed to multiple AWS regions. If you encounter intermittent Apollo schema validation failures when doing simultaneous regional deployments, try setting this variable to one of your deployment regions. The schema only needs to be uploaded for a single region.

`variant` (optional) The variant of your graph to register the schema with. If not provided the value is set to the current serverless stage. See <https://www.apollographql.com/docs/studio/org/graphs/#managing-environments-with-variants> for more information.

## Couldn't I just use the serverless-hooks-plugin to do this?

Yes you could but this would potentially log your apolloKey in your build server logs which is undesirable.
