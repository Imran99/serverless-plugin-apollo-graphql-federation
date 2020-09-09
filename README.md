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
      apolloKey: apollo-api-key
      graphs:
        - name: 'myGraph'
          url: https://my-implementing-service/mygraphendpoint
          schema: './myGraph/schema.gql',
```

## Couldn't I just use the serverless-hooks-plugin to do this?
Yes you could but this would potentially log your apolloKey in your build server logs which is undesirable.