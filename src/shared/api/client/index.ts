import { ApiClient } from "./client.js";
import { createOrdersClient } from "./orders.client.js";
import { createProductsClient } from "./products.client.js";

export * from "./client.js";
export * from "./orders.client.js";
export * from "./products.client.js";

export function createApiClient(
  options: import("./client.js").ApiClientOptions,
) {
  const client = new ApiClient(options);
  return {
    ...createOrdersClient(client),
    ...createProductsClient(client),
  };
}
