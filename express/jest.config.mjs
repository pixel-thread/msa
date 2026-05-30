import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, '.env.test') });

const jestConfig = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/__tests__'],
  testMatch: ['**/*.test.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@feature/(.*)$': '<rootDir>/src/features/$1',
    '^@validator/(.*)$': '<rootDir>/src/shared/validators/$1',
    '^@lib/(.*)$': '<rootDir>/src/shared/lib/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@utils/(.*)$': '<rootDir>/src/shared/utils/$1',
    '^@errors/(.*)$': '<rootDir>/src/shared/errors/$1',
    '^@upstash/ratelimit$': '<rootDir>/src/__mocks__/ratelimit.ts',
    '^@upstash/redis$': '<rootDir>/src/__mocks__/redis.ts',
    '^expo-server-sdk$': '<rootDir>/src/__mocks__/expo-server-sdk.ts',
    '^resend$': '<rootDir>/src/__mocks__/resend.ts',
    '^jose$': '<rootDir>/src/__mocks__/jose.ts',
    '^jose/errors$': '<rootDir>/src/__mocks__/jose.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  testTimeout: 30000,
  maxWorkers: 1,
  verbose: true,
  bail: false,
  forceExit: true,
  detectOpenHandles: true,
};

export default jestConfig;
