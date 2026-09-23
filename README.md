# Serverless Plugin Apollo Graphql Federation

A serverless plugin that uploads graphql schemas to Apollo managed federation. This plugin should be used in implementing services. This allows the gateway service to pull schema from apollo managed federation and also stops implementing services from uploading invalid schemas that would cause the gateway to fail.

## Usage

Install with npm

```sh
npm i -D serverless-plugin-apollo-graphql-federation
```

Add to serverless.yml

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
        - name: 'myGraph'
          apolloKey: apollo-api-key-for-my-graph
          url: https://my-implementing-service/mygraphendpoint
          schema: './myGraph/schema.gql',
```

Deploy using `sls deploy --region xxx` or `sls apollo service:push`

`uploadForDeploymentRegion` (optional) is used for multi-region deployments where the same api is deployed to multiple AWS regions. If you encounter intermittent Apollo schema validation failures when doing simultaneous regional deployments, try setting this variable to one of your deployment regions. The schema only needs to be uploaded for a single region.

`skipCheck` (optional, default `false`) skips `rover subgraph check` and publishes directly. Set it at the top level of `apolloGraphQLFederation` to apply to every graph, or on an individual graph entry to override the default for just that graph. It can also be set for a single deploy without editing `serverless.yml`, via the `APOLLO_SKIP_CHECK=true` environment variable.

This exists for breaking a deadlock: when a value type (e.g. an enum) shared by two subgraphs is used as both an input and an output type, composition requires every subgraph defining it to already have a matching schema published before any of their checks can pass — so if neither has published yet, neither's check ever succeeds. Use `skipCheck` on one subgraph's deploy to seed the registry, then the other subgraph's normal check will pass on its next deploy. Leave it off otherwise; it removes the safety net that stops a broken schema from reaching your gateway.

## Couldn't I just use the serverless-hooks-plugin to do this?
Yes you could but this would potentially log your apolloKey in your build server logs which is undesirable.