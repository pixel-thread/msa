import { prisma } from '@lib/prisma';
import { Prisma } from '@prisma/client';

/** Parameters for updating an association. */
type Props = {
  where: { id: string };
  data: Prisma.AssociationUpdateInput;
};

/** Update an existing association by ID. */
export async function updateAssociation(props: Props) {
  const { where, data } = props;
  return await prisma.association.update({
    where,
    data,
  });
}
