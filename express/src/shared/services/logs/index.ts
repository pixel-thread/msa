import { prisma } from '@src/shared/lib/prisma';
import { Prisma } from '@prisma/client';

/** Input for creating a single log entry. */
type Props = {
  data: Prisma.LogCreateInput;
};

/** Persists a single log entry to the database. */
export async function createLogs(props: Props) {
  return await prisma.log.create(props);
}

/** Input for creating multiple log entries at once. */
type BatchProps = {
  data: Prisma.LogCreateInput[];
};

/** Persists multiple log entries in a single database write. */
export async function createLogsBatch(props: BatchProps) {
  if (props.data.length === 0) return;

  await prisma.log.createMany({
    data: props.data,
  });
}
