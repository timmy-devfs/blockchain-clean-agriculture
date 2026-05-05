import { orderService } from "../services/order.service";

export async function handleShipmentUpdatedMessage(eventPayload: unknown): Promise<void> {
  await orderService.handleShipmentUpdatedEvent(eventPayload);
}
