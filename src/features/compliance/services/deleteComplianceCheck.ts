import 'server-only';
import { prisma } from '@src/shared/lib/prisma';

type Props = {
  where: { id: string };
};

export async function deleteComplianceCheck({ where }: Props) {
  return await prisma.complianceCheck.delete({ where });
}
