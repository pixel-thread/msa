import type { ProductQueryInput } from "~/features/products/validators";

type KeyFilters =
  | Partial<ProductQueryInput>
  | Record<string, unknown>
  | undefined;

const cleanFilters = (filters?: KeyFilters) =>
  Object.fromEntries(
    Object.entries(filters ?? {}).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );

export const queryKeys = {
  products: {
    all: ["products"] as const,
    list: (filters?: Partial<ProductQueryInput>) =>
      ["products", "list", cleanFilters(filters)] as const,
    detail: (id: string) => ["products", "detail", id] as const,
  },
  orders: {
    all: ["orders"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["orders", "list", cleanFilters(filters)] as const,
    detail: (id: string) => ["orders", "detail", id] as const,
    tracking: (id: string) => ["orders", "tracking", id] as const,
  },
  admin: {
    orders: {
      list: (filters?: Record<string, unknown>) =>
        ["admin", "orders", "list", cleanFilters(filters)] as const,
      detail: (id: string) => ["admin", "orders", "detail", id] as const,
    },
    products: {
      list: (filters?: Record<string, unknown>) =>
        ["admin", "products", "list", cleanFilters(filters)] as const,
      detail: (id: string) => ["admin", "products", "detail", id] as const,
    },
    analytics: {
      revenue: (period: string) =>
        ["admin", "analytics", "revenue", period] as const,
    },
  },
} as const;
