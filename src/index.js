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
    const apolloKey = get(serverless, 'service.custom.apolloGraphQLFederation.apolloKey');
    const serviceUrl = get(serverless, 'service.custom.apolloGraphQLFederation.serviceUrl');
    const localSchemaFile = get(serverless, 'service.custom.apolloGraphQLFederation.localSchemaFile');
    const graph = get(serverless, 'service.custom.apolloGraphQLFederation.graph');

    if (!apolloKey) {
      this.logError('Apollo api key was not provided');
      return;
    }
    process.env.APOLLO_KEY = apolloKey; //set this here to avoid it being logged

    const provider = serverless.getProvider('aws');
    const { service } = serverless.service;
    const stage = provider.getStage();

    this.logMessage('Validating federated graphql schema...');
    await apollo.run([
      'service:push',
      `--graph=${graph}`,
      `--variant=${stage}`,
      `--serviceName=${service}`,
      `--serviceURL=${serviceUrl}`,
      `--localSchemaFile=${localSchemaFile}`
    ]);
  }

  logMessage(message) {
    this.serverless.cli.consoleLog(`Apollo GraphQL Federation: ${chalk.yellow(message)}`);
  }

  logError(message) {
    this.serverless.cli.consoleLog(`Apollo GraphQL Federation: ${chalk.red(message)}`);
  }
}

module.exports = ServerlessPlugin;
