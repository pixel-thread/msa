import 'server-only';
import { prisma } from '@lib/prisma';

type Props = {
  id: string;
};

export async function deleteAssociation(props: Props) {
  return await prisma.association.update({
    where: { id: props.id },
    data: { status: 'DELETED' },
  });
}
