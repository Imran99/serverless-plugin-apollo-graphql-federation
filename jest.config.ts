import type { Config } from '@jest/types';
import { pathsToModuleNameMapper } from 'ts-jest/utils';
import tsConfig from './tsconfig.json';

export default <Config.InitialOptions>{
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 10000,
  maxWorkers: 1,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  collectCoverageFrom: ['src/**/*.ts'],
  moduleDirectories: ['node_modules', 'src'],
  moduleNameMapper: pathsToModuleNameMapper(tsConfig.compilerOptions.paths, {
    prefix: '<rootDir>',
  }),
  testMatch: ['**/?(*.)+(spec|test).+(ts|js)'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
};
