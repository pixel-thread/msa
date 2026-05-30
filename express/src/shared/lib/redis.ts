import { Redis } from '@upstash/redis';

/** Singleton Upstash Redis client configured from environment variables. */
export const redis = Redis.fromEnv();
