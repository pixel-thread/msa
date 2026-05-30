export interface Association {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo: string | null;
  country: string;
  state: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    meetings: number;
  };
}
