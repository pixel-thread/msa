import type {
  ApiProduct,
  BakeryCategoryOption,
  ProductCategory,
} from "@shared/types";

const catalogTimestamp = "2026-04-28T09:00:00.000Z";

/**
 * --- BRANDING & APP METADATA ---
 */
export const APP_NAME = "The Bakery";
export const APP_TAGLINE = "Slow doughs, sharp layers, and artisanal cakes.";

/**
 * --- PRODUCT CONSTANTS ---
 */
export const PRODUCT_CATEGORIES = ["BREAD", "PASTRY", "CAKE"] as const;

export const bakeryCategoryOptions: BakeryCategoryOption[] = [
  {
    value: "BREAD",
    label: "Bread",
    description: "Slow-fermented loaves, enriched doughs, and savory bakes.",
  },
  {
    value: "PASTRY",
    label: "Pastry",
    description: "Laminated classics, viennoiserie, and breakfast layers.",
  },
  {
    value: "CAKE",
    label: "Cake",
    description: "Celebration slices, tea cakes, and plated dessert finishes.",
  },
];

/**
 * --- ORDER CONSTANTS ---
 */
export const ORDER_STATUSES = [
  "PENDING",
  "BAKING",
  "READY",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
] as const;

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;

/**
 * --- REAL-TIME (PUSHER) ---
 */
export const PUSHER_CHANNELS = {
  ORDERS: "orders", // Global admin channel
  ORDER_DETAIL: (orderId: string) => `order-${orderId}`,
  USER_NOTIFICATIONS: (userId: string) => `user-notifications-${userId}`,
} as const;

export const PUSHER_EVENTS = {
  ORDER_CREATED: "order-created",
  ORDER_UPDATED: "order-updated",
  NOTIFICATION_RECEIVED: "notification-received",
} as const;

/**
 * --- MOCK DATA (For Seed & Initial Load) ---
 */
export const bakeryProducts: ApiProduct[] = [
  {
    id: "country-sourdough",
    name: "Country Sourdough",
    description:
      "Crackling crust sourdough with a mild tang, open crumb, and caramelized finish.",
    price: 9.5,
    category: "BREAD",
    stock: 12,
    isActive: true,
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
    createdAt: catalogTimestamp,
    updatedAt: catalogTimestamp,
  },
  {
    id: "almond-croissant",
    name: "Almond Croissant",
    description:
      "Twice-baked croissant filled with almond cream and finished with toasted flakes.",
    price: 6.75,
    category: "PASTRY",
    stock: 14,
    isActive: true,
    imageUrl:
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=80",
    createdAt: catalogTimestamp,
    updatedAt: catalogTimestamp,
  },
  {
    id: "burnt-honey-cheesecake",
    name: "Burnt Honey Cheesecake",
    description:
      "Silky baked cheesecake with a bronzed top and a warm acacia honey finish.",
    price: 8.4,
    category: "CAKE",
    stock: 9,
    isActive: true,
    imageUrl:
      "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=1200&q=80",
    createdAt: catalogTimestamp,
    updatedAt: catalogTimestamp,
  },
];

export const featuredBakeryProductIds = [
  "country-sourdough",
  "almond-croissant",
  "burnt-honey-cheesecake",
];

export const bakeryStory = {
  headline:
    "Slow doughs, sharp layers, and cakes built for the afternoon rush.",
  summary:
    "The Bakery is positioned as a neighborhood production bakery: daily bread, laminated pastries, and plated dessert quality in a quick-order format.",
};
