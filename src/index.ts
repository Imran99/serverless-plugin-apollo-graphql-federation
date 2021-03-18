/* eslint-disable class-methods-use-this */
/* eslint-disable no-restricted-syntax */
/* eslint-disable import/prefer-default-export */
/* eslint-disable no-await-in-loop */
import type Serverless from 'serverless';
import type AwsProvider from 'serverless/plugins/aws/provider/awsProvider';
import apollo from 'apollo';
import chalk from 'chalk';
import type { IGraph, IService } from './types';

export class ServerlessPlugin {
  public readonly serverless: Serverless;

  public readonly options: any;

  public readonly hooks: { [key: string]: Function };

  public constructor(serverless: Serverless, options: any) {
    this.serverless = serverless;
    this.options = options;
    this.hooks = {
      'after:deploy:deploy': this.uploadFederatedSchema.bind(this),
    };
  }

  public async uploadFederatedSchema(): Promise<void> {
    const provider: AwsProvider = this.serverless.getProvider('aws');
    const stage: string = provider.getStage();
    const region: string = provider.getRegion();
    const graphs: IGraph[] = this.serverless.service.custom.apolloGraphQLFederation.graphs || [];
    const { uploadForDeploymentRegion } = this.serverless.service.custom.apolloGraphQLFederation;

    if (graphs.length <= 0) {
      this.logError('Graph configuration was not provided, skipping schema validation');
      return;
    }

    if (uploadForDeploymentRegion && uploadForDeploymentRegion !== region) {
      this.logMessage(`Skipping schema upload for region '${region}'`);
      return;
    }

    for (const graph of graphs) {
      this.logMessage(`Validating graph '${chalk.bold(graph.name)}'...`);
      this.validateGraph(graph);

      const variant = graph.variant || stage;

      for (const service of graph.services) {
        this.logMessage(`Validating service '${chalk.bold(service.name)}'...`);
        this.validateService(service);

        await apollo.run([
          'service:push',
          `--graph=${graph.name}`,
          `--key=${graph.key}`,
          `--variant=${variant}`,
          `--serviceName=${service.name}`,
          `--serviceURL=${service.url}`,
          `--localSchemaFile=${service.schema}`,
        ]);

        this.logMessage(`Service ${service.name} uploaded successfully`);
      }

      this.logMessage(`Graph ${graph.name} uploaded successfully`);
    }
  }

  private validateGraph(graph: IGraph) {
    if (!graph.name) {
      throw new Error(`Name not found for graph ${graph.name}`);
    }
    if (!graph.key) {
      throw new Error(`Apollo key not found for graph '${graph.name}'`);
    }
    if (!graph.services || graph.services.length <= 0) {
      throw new Error(`Services not found for graph '${graph.name}'`);
    }
  }

  private validateService(service: IService) {
    if (!service.name) {
      throw new Error(`Name not found for service '${service.name}'`);
    }
    if (!service.schema) {
      throw new Error(`Schema not found for service '${service.name}'`);
    }
    if (!service.url) {
      throw new Error(`Url not found for service '${service.url}'`);
    }
  }

  private logMessage(message: string): void {
    this.serverless.cli.log(`Apollo GraphQL Federation: ${chalk.yellow(message)}`);
  }

  private logError(message: string): void {
    this.serverless.cli.log(`Apollo GraphQL Federation: ${chalk.red(message)}`);
  }
}
