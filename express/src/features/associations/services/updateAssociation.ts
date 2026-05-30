import { prisma } from '@lib/prisma';
import { Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Parameters for updating an association. */
type Props = {
  where: { id: string };
  data: Prisma.AssociationUpdateInput;
};

// ---------------------------------------------------------------------------
// Update association
// ---------------------------------------------------------------------------

/** Update an existing association by ID. */
export async function updateAssociation(props: Props) {
  const { where, data } = props;

  return await prisma.association.update({
    where,
    data,
  });
}
