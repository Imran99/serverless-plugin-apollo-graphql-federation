'use strict';

const childProcess = require('child_process');
const plugin = require('../src/index.js');

describe('Uploading federated schema to Apollo', () => {
  beforeAll(() => {
    jest.spyOn(childProcess, 'execSync').mockReturnValue({
      toString: jest.fn()
    });
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('when a valid schema is provided', () => {
    beforeAll(() => {
      const sls = {
        cli: { consoleLog: () => { } },
        getProvider: () => ({ getStage: () => 'myStage' }),
        service: {
          service: 'my-implementing-service',
          custom: {
            apolloGraphQLFederation: {
              apolloKey: '1234',
              serviceUrl: 'https://my-implementing-service.com/graphql',
              localSchemaFile: './schema.gql',
              graph: 'myGraph'
            }
          }
        }
      };
      const slsPlugin = new plugin(sls, null);
      slsPlugin.uploadFederatedSchema();
    });

    test('calls the apollo cli to upload the schema with the correct arguments', () => {
      expect(childProcess.execSync)
        .toHaveBeenCalledTimes(1)
        .toHaveBeenLastCalledWith('npx apollo service:push --graph=myGraph --variant=myStage --serviceName=my-implementing-service --serviceURL=https://my-implementing-service.com/graphql --localSchemaFile=./schema.gql');
    });
  });
});
