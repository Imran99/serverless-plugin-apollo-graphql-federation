'use strict';

const get = require('lodash.get');
const chalk = require('chalk');
const exec = require('child_process');

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
    const region = provider.getRegion();
    const graphs = get(serverless, 'service.custom.apolloGraphQLFederation.graphs', []);
    const uploadForDeploymentRegion = get(serverless, 'service.custom.apolloGraphQLFederation.uploadForDeploymentRegion');
    const skipCheckByDefault = get(serverless, 'service.custom.apolloGraphQLFederation.skipCheck', false);

    if (graphs.length <= 0) {
      this.logError('Graph configuration was not provided, skipping schema validation');
      return;
    }

    if (uploadForDeploymentRegion != null && region !== uploadForDeploymentRegion) {
      this.logMessage(`Skipping schema upload for ${region}`);
      return;
    }

    for (const graph of graphs) {
      const { name, url, schema, apolloKey, variant, skipCheck = skipCheckByDefault } = graph;
      if (!apolloKey) {
        throw new Error(`Apollo api key was not provided for '${name}' graph`);
      }
      if (!variant) {
        throw new Error(`Graph variant was not provided for '${name}' graph`);
      }

      process.env.APOLLO_KEY = apolloKey;

      // A shared value type used as both an input and an output type requires every subgraph
      // defining it to already have a matching schema published before any of their checks can
      // pass, so when none of them have published yet, nobody can get past this gate first.
      // Skipping the check lets one subgraph publish to seed the registry and break the deadlock.
      if (skipCheck || process.env.APOLLO_SKIP_CHECK === 'true') {
        this.logMessage(`Skipping composition check for '${name}@${variant}', publishing directly`);
      } else {
        this.logMessage(`Validating '${name}' federated graphql schema...`);
        exec.execSync(`npx --yes rover subgraph check ${name}@${variant} --schema ${schema} --name ${service}`, {
          stdio: 'inherit'
        });
      }

      exec.execSync(`npx --yes rover subgraph publish ${name}@${variant} --schema ${schema} --name ${service} --routing-url ${url}`, {
        stdio: 'inherit'
      });
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
