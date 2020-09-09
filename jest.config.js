'use strict';

module.exports = {
  setupFilesAfterEnv: ['./test/setup.js'],
  maxWorkers: '1',
  testEnvironment: 'node',
  testMatch: [
    '**/test/**/*test.js'
  ],
  verbose: false
};
