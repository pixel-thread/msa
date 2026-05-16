export interface ProviderResponse {
  id: string;
  associationId: string;
  provider: string;
  keyId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertProviderInput {
  provider: string;
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
  isActive?: boolean;
}

export interface UpdateProviderInput {
  keyId?: string;
  keySecret?: string;
  webhookSecret?: string;
  isActive?: boolean;
}
