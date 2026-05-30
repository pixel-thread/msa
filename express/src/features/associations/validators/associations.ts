/**
 * @file Association Membership Validators
 * @description Zod schemas for validating membership-related operations in associations.
 */

import { z } from 'zod';

/**
 * Schema for validating add-member-to-association requests.
 * Ensures both IDs are valid UUIDs.
 */
export const AddAssociationMemberSchema = z.object({
  /** The unique ID of the association. */
  association_id: z.string().uuid(),

  /** The unique ID of the user to add. */
  user_id: z.string().uuid(),
});
