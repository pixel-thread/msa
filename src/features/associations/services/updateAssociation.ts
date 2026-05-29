import 'server-only';
import { prisma } from '@lib/prisma';
import { Prisma } from '@prisma/client';

type Props = {
  where: { id: string };
  data: Prisma.AssociationUpdateInput;
};

export async function updateAssociation(props: Props) {
  const { where, data } = props;
  return await prisma.association.update({
    where,
    data,
  });
}
