'use strict';

const plugin = require('../src/index.js');
const exec = require('child_process');

describe('Uploading federated schema to Apollo', () => {
  beforeAll(() => {
    jest.spyOn(exec, 'execSync').mockImplementation();
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('when the apollo key is not provided', () => {
    let slsPlugin;
    beforeAll(async () => {
      const sls = given_an_sls_instance({ withApolloKey: undefined });
      slsPlugin = new plugin(sls, null);
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    test('throws an error', () => {
      expect(slsPlugin.uploadFederatedSchema()).rejects.toEqual(new Error(
        'Apollo api key was not provided for \'myGraph\' graph'
      ));
    });
  });

  describe('when the variant is not provided', () => {
    let slsPlugin;
    beforeAll(async () => {
      const sls = given_an_sls_instance({ withVariant: undefined });
      slsPlugin = new plugin(sls, null);
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    test('throws an error', () => {
      expect(slsPlugin.uploadFederatedSchema()).rejects.toEqual(new Error(
        'Graph variant was not provided for \'myGraph\' graph'
      ));
    });
  });

  describe('when a valid schema is provided', () => {
    beforeAll(async () => {
      const sls = given_an_sls_instance();
      const slsPlugin = new plugin(sls, null);
      await slsPlugin.uploadFederatedSchema();
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    test('calls the apollo cli to validate the schema with the correct arguments', () => {
      expect(rover.run)
        .toHaveBeenCalledTimes(1)
        .toHaveBeenCalledWith([
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

  describe('when an upload region is specified and the service is being deployed in that region', () => {
    beforeAll(async () => {
      const sls = given_an_sls_instance({ withRegion: 'eu-west-2', withUploadForDeploymentRegion: 'eu-west-2' });
      const slsPlugin = new plugin(sls, null);
      await slsPlugin.uploadFederatedSchema();
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    test('calls the apollo cli to validate the schema with the correct arguments', () => {
      expect(rover.run)
        .toHaveBeenCalledTimes(1)
        .toHaveBeenCalledWith([
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

  describe('when an upload region is specified but the service is being deployed in a different region', () => {
    beforeAll(async () => {
      const sls = given_an_sls_instance({ withRegion: 'us-east-1', withUploadForDeploymentRegion: 'eu-west-2' });
      const slsPlugin = new plugin(sls, null);
      await slsPlugin.uploadFederatedSchema();
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    test('does not call the apollo cli to validate the schema', () => {
      expect(rover.run)
        .not
        .toHaveBeenCalled();
    });
  });

  const given_an_sls_instance = ({ withApolloKey, withRegion, withUploadForDeploymentRegion, withVariant } = {}) => {
    return {
      cli: { consoleLog: () => { } },
      getProvider: () => ({
        getRegion: () => withRegion ?? 'eu-west-2'
      }),
      service: {
        service: 'my-implementing-service',
        custom: {
          apolloGraphQLFederation: {
            uploadForDeploymentRegion: withUploadForDeploymentRegion,
            graphs: [{
              name: 'myGraph',
              apolloKey: withApolloKey ?? '1234',
              url: 'https://my-implementing-service.com/graphql',
              schema: './schema.gql',
              variant: withVariant ?? 'myStage'
            }]
          }
        }
      }
    };
  };
});
