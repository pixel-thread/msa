import { z } from 'zod';

export const AddAssociationMemberSchema = z.object({
  association_id: z.string().uuid(),
  user_id: z.string().uuid(),
});
