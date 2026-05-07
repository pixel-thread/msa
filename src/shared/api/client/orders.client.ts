import type {
  CreateOrderInput,
  FeedbackInput,
  UpdateOrderStatusInput,
} from "~/features/orders/validators";
import type { ApiOrder, OrderCollection } from "~/shared/types";
import type { ApiClient } from "./client.js";

export function createOrdersClient(client: ApiClient) {
  return {
    createOrder(body: CreateOrderInput) {
      return client.post<ApiOrder, CreateOrderInput>("/api/v1/orders", {
        body,
      });
    },

    getOrders() {
      return client.get<OrderCollection>("/api/v1/orders");
    },

    getOrder(orderId: string) {
      return client.get<ApiOrder>(`/api/v1/orders/${orderId}`);
    },

    submitFeedback(orderId: string, body: FeedbackInput) {
      return client.post<{ ok: true }, FeedbackInput>(
        `/api/v1/orders/${orderId}/feedback`,
        { body },
      );
    },

    updateOrderStatus(orderId: string, body: UpdateOrderStatusInput) {
      return client.patch<ApiOrder, UpdateOrderStatusInput>(
        `/api/v1/admin/orders/${orderId}`,
        { body },
      );
    },
  };
}
