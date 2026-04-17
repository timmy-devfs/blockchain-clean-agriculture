import { orderService } from "../services/order.service";

export async function handleOrderConfirmedMessage(eventPayload: unknown): Promise<void> {
  await orderService.handleOrderConfirmedEvent(eventPayload);
}
