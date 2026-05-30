import { z } from 'zod';

// ---------------------------------------------------------------------------
// Add-member-to-association schema
// ---------------------------------------------------------------------------

/** Schema for validating add-member-to-association requests. */
export const AddAssociationMemberSchema = z.object({
  association_id: z.string().uuid(),
  user_id: z.string().uuid(),
});
