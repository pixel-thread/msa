import "server-only";
import { Writable } from "stream";
import { prisma } from "@src/shared/lib/prisma";

const PINO_LEVELS: Record<number, string> = {
  10: "trace",
  20: "debug",
  30: "info",
  40: "warn",
  50: "error",
  60: "fatal",
};

export function createPostgresTransport() {
  return new Writable({
    objectMode: true,

    async write(chunk, _encoding, callback) {
      try {
        const raw =
          typeof chunk === "string"
            ? chunk
            : Buffer.isBuffer(chunk)
              ? chunk.toString()
              : JSON.stringify(chunk);

        const parsed = JSON.parse(raw);
        const { level, time, pid, hostname, msg, ...rest } = parsed;

        await prisma.log.create({
          data: {
            type: PINO_LEVELS[level as number] ?? "info",
            message: typeof msg === "string" ? msg : JSON.stringify(msg),
            content: rest as object,
            isBackend: true,
          },
        });

        callback();
      } catch (error) {
        console.error("Postgres log transport error:", error);
        callback();
      }
    },
  });
}
