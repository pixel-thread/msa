import { prisma } from "@src/shared/lib/prisma";
import { PAGE_SIZE } from "@src/shared/constants";
import { Prisma } from "@prisma/client";
import { buildPagination } from "@src/shared/utils/build-pagination";

type GetLogsProps = {
  where: Prisma.LogWhereInput;
  page: number;
};

export async function getLogs(props: GetLogsProps) {
  const { where, page } = props;

  const [logs, total] = await prisma.$transaction([
    prisma.log.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.log.count({ where }),
  ]);

  const pagination = buildPagination(total, page);

  return { logs, pagination };
}

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
