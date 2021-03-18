import apollo from 'apollo';
import type Serverless from 'serverless';
import { ServerlessPlugin as Plugin } from '../src/index';

describe('Uploading federated schema to Apollo', () => {
  const givenAnSlsInstance = ({
    withApolloKey,
    withRegion,
    withVariant,
    withUploadForDeploymentRegion,
  }: {
    withApolloKey?: string;
    withRegion?: string;
    withVariant?: string;
    withUploadForDeploymentRegion?: string;
  } = {}): Serverless =>
    (({
      cli: { log: () => {} },
      getProvider: () => ({
        getStage: () => 'myStage',
        getRegion: () => withRegion || 'eu-west-2',
      }),
      service: {
        service: 'my-implementing-service',
        custom: {
          apolloGraphQLFederation: {
            uploadForDeploymentRegion: withUploadForDeploymentRegion,
            graphs: [
              {
                name: 'myGraph',
                key: withApolloKey || '1234',
                ...(withVariant !== undefined && { variant: withVariant }),
                url: 'https://my-implementing-service.com/graphql',
                schema: './schema.gql',
              },
            ],
          },
        },
      },
    } as unknown) as Serverless);

  beforeAll(() => {
    jest.spyOn(apollo, 'run').mockImplementation();
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('when the apollo key is not provided', () => {
    let slsPlugin: Plugin;
    beforeAll(async () => {
      const sls = givenAnSlsInstance({ withApolloKey: undefined });
      slsPlugin = new Plugin(sls, null);
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    test('throws an error', async () => {
      await expect(slsPlugin.uploadFederatedSchema()).rejects.toEqual(
        new Error("Apollo api key was not provided for 'myGraph' graph"),
      );
    });
  });

  describe('when a valid schema is provided', () => {
    beforeAll(async () => {
      const sls = givenAnSlsInstance();
      const slsPlugin = new Plugin(sls, null);
      await slsPlugin.uploadFederatedSchema();
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    test('calls the apollo cli to validate the schema with the correct arguments', async () => {
      const apolloRun = await expect(apollo.run);
      apolloRun.toHaveBeenCalledTimes(1);
      apolloRun.toHaveBeenCalledWith([
        'service:push',
        '--graph=myGraph',
        '--variant=myStage',
        '--serviceName=my-implementing-service',
        '--serviceURL=https://my-implementing-service.com/graphql',
        '--localSchemaFile=./schema.gql',
        '--key=1234',
      ]);
    });
  });

  describe('when an upload region is specified and the service is being deployed in that region', () => {
    beforeAll(async () => {
      const sls = givenAnSlsInstance({
        withRegion: 'eu-west-2',
        withUploadForDeploymentRegion: 'eu-west-2',
      });
      const slsPlugin = new Plugin(sls, null);
      await slsPlugin.uploadFederatedSchema();
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    test('calls the apollo cli to validate the schema with the correct arguments', async () => {
      const apolloRun = await expect(apollo.run);
      apolloRun.toHaveBeenCalledTimes(1);
      apolloRun.toHaveBeenCalledWith([
        'service:push',
        '--graph=myGraph',
        '--variant=myStage',
        '--serviceName=my-implementing-service',
        '--serviceURL=https://my-implementing-service.com/graphql',
        '--localSchemaFile=./schema.gql',
        '--key=1234',
      ]);
    });
  });

  describe('when an upload region is specified but the service is being deployed in a different region', () => {
    beforeAll(async () => {
      const sls = givenAnSlsInstance({
        withRegion: 'us-east-1',
        withUploadForDeploymentRegion: 'eu-west-2',
      });
      const slsPlugin = new Plugin(sls, null);
      await slsPlugin.uploadFederatedSchema();
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    test('does not call the apollo cli to validate the schema', () => {
      expect(apollo.run).not.toHaveBeenCalled();
    });
  });
});
