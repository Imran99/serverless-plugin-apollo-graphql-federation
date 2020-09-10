'use strict';

const plugin = require('../src/index.js');
const apollo = require('apollo');

describe('Uploading federated schema to Apollo', () => {
  beforeAll(() => {
    jest.spyOn(apollo, 'run').mockImplementation();
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('when a valid schema is provided', () => {
    beforeAll(async () => {
      const sls = {
        cli: { consoleLog: () => { } },
        getProvider: () => ({ getStage: () => 'myStage' }),
        service: {
          service: 'my-implementing-service',
          custom: {
            apolloGraphQLFederation: {
              graphs: [{
                name: 'myGraph',
                apolloKey: '1234',
                url: 'https://my-implementing-service.com/graphql',
                schema: './schema.gql',
              }]
            }
          }
        }
      };
      const slsPlugin = new plugin(sls, null);
      await slsPlugin.uploadFederatedSchema();
    });

    test('calls the apollo cli to upload the schema with the correct arguments', () => {
      expect(apollo.run)
        .toHaveBeenCalledTimes(1)
        .toHaveBeenLastCalledWith([
          'service:push',
          '--graph=myGraph',
          '--variant=myStage',
          '--serviceName=my-implementing-service',
          '--serviceURL=https://my-implementing-service.com/graphql',
          '--localSchemaFile=./schema.gql',
          '--key=1234'
        ]);
    });
  });
});
