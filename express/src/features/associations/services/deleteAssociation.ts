import { prisma } from '@lib/prisma';

/** Parameters for deleting an association. */
type Props = {
  id: string;
};

/** Soft-delete an association by setting its status to DELETED. */
export async function deleteAssociation(props: Props) {
  return await prisma.association.update({
    where: { id: props.id },
    data: { status: 'DELETED' },
  });
}
