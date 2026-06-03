/** Public unique order reference shown to customers and admins. */
export function displayOrderId(order: { order_uid?: string; id: number }): string {
  return order.order_uid || `DWR-${String(order.id).padStart(6, '0')}`;
}
