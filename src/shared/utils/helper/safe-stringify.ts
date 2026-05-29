import { env } from '@src/env';

const isProduction = env.NEXT_PUBLIC_NODE_ENV === 'production';

export const safeStringify = (obj: unknown): string => {
  const sensitiveKeys = [
    'password',
    'token',
    'jwt',
    'authorization',
    'secret',
    'key',
    'cookie',
    'sig',
    'host',
    'ip',
    'username',
    'userName',
  ];

  const seen = new WeakSet();

  const redacted = (value: unknown): unknown => {
    if (typeof value === 'bigint') {
      return value.toString();
    }

    if (value && typeof value === 'object') {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);

      if (Array.isArray(value)) {
        return value.map(redacted);
      }

      if (value instanceof Error) {
        return {
          name: value.name,
          message: value.message,
          stack: isProduction ? undefined : value.stack,
        };
      }

      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [
          k,
          sensitiveKeys.some((sk) => k.toLowerCase().includes(sk)) ? '[REDACTED]' : redacted(v),
        ]),
      );
    }
    return value;
  };

  try {
    return JSON.stringify(redacted(obj));
  } catch (err) {
    return `[Serialization Error: ${String(err)}]`;
  }
};
