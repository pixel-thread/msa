import 'server-only';
import { prisma } from '@src/shared/lib/prisma';
import { Prisma } from '@prisma/client';

type Props = {
  data: Prisma.LogCreateInput;
};

export async function createLogs(props: Props) {
  return await prisma.log.create(props);
}

type BatchProps = {
  data: Prisma.LogCreateInput[];
};

export async function createLogsBatch(props: BatchProps) {
  if (props.data.length === 0) return;

  await prisma.log.createMany({
    data: props.data,
  });
}
