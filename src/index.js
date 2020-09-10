'use strict';

const get = require('lodash.get');
const chalk = require('chalk');
const apollo = require('apollo');

class ServerlessPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.hooks = {
      'after:deploy:deploy': this.uploadFederatedSchema.bind(this),
    };
  }

  async uploadFederatedSchema() {
    const { serverless } = this;
    const provider = serverless.getProvider('aws');
    const { service } = serverless.service;
    const stage = provider.getStage();
    const graphs = get(serverless, 'service.custom.apolloGraphQLFederation.graphs', []);

    if (graphs.length <= 0) {
      this.logError('Graph configuration was not provided, skipping schema validation');
      return;
    }

    for (const graph of graphs) {
      const { name, url, schema, apolloKey } = graph;
      if (!apolloKey) {
        this.logError(`Apollo api key was not provided for '${name}' graph`);
        break;
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
