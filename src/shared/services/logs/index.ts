import { prisma } from "@src/shared/lib/prisma";
import { Prisma } from "@prisma/client";
import { buildPagination } from "@src/shared/utils/build-pagination";

type GetLogsProps = {
  where: Prisma.LogWhereInput;
  page: number;
  pageSize: number;
};

export async function getLogs(props: GetLogsProps) {
  const { where, page, pageSize } = props;

  const [logs, total] = await prisma.$transaction([
    prisma.log.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.log.count({ where }),
  ]);

  const pagination = buildPagination(total, page, pageSize);

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
