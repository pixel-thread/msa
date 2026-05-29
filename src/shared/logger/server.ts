import 'server-only';
import pino from 'pino';
import { env } from '@src/env';
import { createPostgresTransport } from './postgres-transport';

const isProduction = env.NEXT_PUBLIC_NODE_ENV === 'production';

const REDACTED = [
  'password',
  'secret',
  'token',
  'authorization',
  'key',
  'refreshToken',
  'access_token',
];

const streams: pino.StreamEntry[] = [
  {
    stream: createPostgresTransport(),
    level: 'trace',
  },
];

//
// only log to console in development
//
if (!isProduction) {
  streams.push({
    stream: process.stdout,
    level: 'debug',
  });
}

export const logger = pino(
  {
    level: 'trace',
    redact: REDACTED,
  },
  pino.multistream(streams),
);
