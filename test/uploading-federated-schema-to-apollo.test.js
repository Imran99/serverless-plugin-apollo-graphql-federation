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
      const sls = given_an_sls_instance({ withApolloKey: null });
      slsPlugin = new plugin(sls, null);
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    test('throws an error', async () => {
      await expect(slsPlugin.uploadFederatedSchema()).rejects.toEqual(new Error(
        'Apollo api key was not provided for \'myGraph\' graph'
      ));
    });
  });

  describe('when the variant is not provided', () => {
    let slsPlugin;
    beforeAll(async () => {
      const sls = given_an_sls_instance({ withVariant: null });
      slsPlugin = new plugin(sls, null);
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    test('throws an error', async () => {
      await expect(slsPlugin.uploadFederatedSchema()).rejects.toEqual(new Error(
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

    test('calls the apollo cli to validate the schema as publish no longer throws an error if composition fails', () => {
      expect(exec.execSync)
        .toHaveBeenCalledWith(
          'npx rover subgraph check myGraph@myStage --schema ./schema.gql --name my-implementing-service',
          {
            stdio: 'inherit'
          });
    });

    test('calls the apollo cli to publish the schema with the correct arguments', () => {
      expect(exec.execSync)
        .toHaveBeenCalledWith(
          'npx rover subgraph publish myGraph@myStage --schema ./schema.gql --name my-implementing-service --routing-url https://my-implementing-service.com/graphql',
          {
            stdio: 'inherit'
          });
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

    test('calls the apollo cli to publish the schema with the correct arguments', () => {
      expect(exec.execSync)
        .toHaveBeenCalledWith(
          'npx rover subgraph publish myGraph@myStage --schema ./schema.gql --name my-implementing-service --routing-url https://my-implementing-service.com/graphql',
          {
            stdio: 'inherit'
          });
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
      expect(exec.execSync)
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
              apolloKey: withApolloKey === undefined ? '1234' : withApolloKey,
              url: 'https://my-implementing-service.com/graphql',
              schema: './schema.gql',
              variant: withVariant === undefined ? 'myStage' : withVariant
            }]
          }
        }
      }
    };
  };
});
