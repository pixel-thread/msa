import { env } from "@src/env";
import { safeStringify } from "../utils/helper/safe-stringify";

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  [key: string]: unknown;
}

interface QueuedLog {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
}

const isProduction = process.env.NODE_ENV === "production";
const isServer = typeof window === "undefined";

const BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 5000;

const queue: QueuedLog[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let isFlushing = false;

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

const flushClient = async (batch: QueuedLog[]) => {
  await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/logs/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ logs: batch }),
  });
};

const flush = async () => {
  if (isFlushing || queue.length === 0) return;

  isFlushing = true;
  const batch = queue.splice(0, BATCH_SIZE);

  try {
    await flushClient(batch);
  } catch {
    queue.unshift(...batch);
  } finally {
    isFlushing = false;
  }
};

const startFlushTimer = () => {
  if (flushTimer) return;
  flushTimer = setInterval(async () => {
    await flush();
  }, FLUSH_INTERVAL_MS);
};

const enqueue = (level: LogLevel, message: string, context?: LogContext) => {
  if (level === "debug" || !isProduction) return;

  queue.push({
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  });

  startFlushTimer();

  if (queue.length >= BATCH_SIZE) {
    flush();
  }
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
      console.debug(formatted);
      break;
  }

  enqueue(level, message, context);
};

if (isServer && isProduction) {
  process.on("beforeExit", () => {
    flush();
    if (flushTimer) clearInterval(flushTimer);
  });
}

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
  flush: () => flush(),
};
