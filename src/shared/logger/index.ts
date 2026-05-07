type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  [key: string]: unknown;
}

const isProduction = process.env.NODE_ENV === "production";

const safeStringify = (obj: unknown): string => {
  const sensitiveKeys = [
    "password",
    "token",
    "jwt",
    "authorization",
    "secret",
    "key",
    "cookie",
    "sig",
  ];

  const seen = new WeakSet();

  const redacted = (value: unknown): unknown => {
    if (typeof value === "bigint") {
      return value.toString();
    }

    if (value && typeof value === "object") {
      if (seen.has(value)) {
        return "[Circular]";
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
          sensitiveKeys.some((sk) => k.toLowerCase().includes(sk))
            ? "[REDACTED]"
            : redacted(v),
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

const formatMessage = (
  level: LogLevel,
  message: string,
  context?: LogContext,
): string => {
  const logObj = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  if (isProduction) {
    return safeStringify(logObj);
  }
  return `[${level.toUpperCase()}] ${message}${context ? ` ${safeStringify(context)}` : ""}`;
};

const log = (level: LogLevel, message: string, context?: LogContext) => {
  const formatted = formatMessage(level, message, context);

  switch (level) {
    case "info":
      console.info(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "error":
      console.error(formatted);
      break;
    case "debug":
      if (!isProduction) {
        console.debug(formatted);
      }
      break;
  }
};

export const logger = {
  info: (message: string, context?: LogContext) =>
    log("info", message, context),
  warn: (message: string, context?: LogContext) =>
    log("warn", message, context),
  error: (message: string, context?: LogContext) => {
    const safeContext = context ? { ...context } : {};
    if (safeContext.error && safeContext.error instanceof Error) {
      safeContext.error = {
        name: safeContext.error.name,
        message: isProduction
          ? "Internal Server Error"
          : safeContext.error.message,
      };
    }
    log("error", message, safeContext);
  },
  debug: (message: string, context?: LogContext) =>
    log("debug", message, context),
};
