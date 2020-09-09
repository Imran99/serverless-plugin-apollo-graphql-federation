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
      serviceUrl: https://my-implementing-service.com/
      localSchemaFile: './schema.gql',
      graph: 'myGraph'
```