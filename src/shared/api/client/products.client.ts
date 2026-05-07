import type { ProductQueryInput } from "~/features/products/validators";
import type { ApiProduct, ProductCollection } from "~/shared/types";
import type { ApiClient } from "./client.js";

export function createProductsClient(client: ApiClient) {
  return {
    listProducts(query?: Partial<ProductQueryInput>) {
      return client.get<ProductCollection>("/api/v1/products", { query });
    },

    getProduct(productId: string) {
      return client.get<ApiProduct>(`/api/v1/products/${productId}`);
    },
  };
}
