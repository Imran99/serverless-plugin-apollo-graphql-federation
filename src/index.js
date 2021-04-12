'use strict';

const get = require('lodash.get');
const chalk = require('chalk');
const apollo = require('apollo');

class ServerlessPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.commands = {
      apollo: {
        commands: {
          'service:push': {
            usage: 'Pushes your implementing service schema to apollo managed federation',
            lifecycleEvents: ['push']
          }
        }
      }
    };
    this.hooks = {
      'after:deploy:deploy': this.uploadFederatedSchema.bind(this),
      'apollo:service:push:push': this.uploadFederatedSchema.bind(this),
    };
  }

  async uploadFederatedSchema() {
    const { serverless } = this;
    const provider = serverless.getProvider('aws');
    const { service } = serverless.service;
    const stage = provider.getStage();
    const region = provider.getRegion();
    const graphs = get(serverless, 'service.custom.apolloGraphQLFederation.graphs', []);
    const uploadForDeploymentRegion = get(serverless, 'service.custom.apolloGraphQLFederation.uploadForDeploymentRegion');

    if (graphs.length <= 0) {
      this.logError('Graph configuration was not provided, skipping schema validation');
      return;
    }

    if (uploadForDeploymentRegion != null && region !== uploadForDeploymentRegion) {
      this.logMessage(`Skipping schema upload for ${region}`);
      return;
    }

    for (const graph of graphs) {
      const { name, url, schema, apolloKey } = graph;
      if (!apolloKey) {
        throw new Error(`Apollo api key was not provided for '${name}' graph`);
      }
      this.logMessage(`Validating '${name}' federated graphql schema...`);
      await apollo.run([
        'service:push',
        `--graph=${name}`,
        `--variant=${stage}`,
        `--serviceName=${service}`,
        `--serviceURL=${url}`,
        `--localSchemaFile=${schema}`,
        `--key=${apolloKey}`
      ]);
    }
  }

  logMessage(message) {
    this.serverless.cli.consoleLog(`Apollo GraphQL Federation: ${chalk.yellow(message)}`);
  }

  logError(message) {
    this.serverless.cli.consoleLog(`Apollo GraphQL Federation: ${chalk.red(message)}`);
  }
}

module.exports = ServerlessPlugin;
