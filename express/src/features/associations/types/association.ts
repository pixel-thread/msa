/**
 * @file Association Entity Type
 * @description Defines the structure of an association object.
 */

/**
 * Represents an association entity.
 */
export interface Association {
  /** Unique identifier for the association. */
  id: string;

  /** URL-friendly identifier. */
  slug: string;

  /** Display name of the association. */
  name: string;

  /** Detailed description of the association. */
  description: string | null;

  /** URL to the association's logo image. */
  logo: string | null;

  /** Country where the association is based. */
  country: string;

  /** State or province where the association is based. */
  state: string | null;

  /** Primary email address for contacting the association. */
  contactEmail: string | null;

  /** Primary phone number for contacting the association. */
  contactPhone: string | null;

  /** Hex code for the primary brand color. */
  primaryColor: string | null;

  /** Hex code for the secondary brand color. */
  secondaryColor: string | null;

  /** Whether the association is currently active. */
  isActive: boolean;

  /** ISO timestamp of when the record was created. */
  createdAt: string;

  /** ISO timestamp of when the record was last updated. */
  updatedAt: string;

  /** Relation counts for related entities. */
  _count?: {
    /** Total number of users in this association. */
    users: number;

    /** Total number of meetings held by this association. */
    meetings: number;
  };
}
