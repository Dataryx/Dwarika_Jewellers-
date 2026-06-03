export function itemsSubtotal(items) {
  return (items || []).reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
}

/** Breakdown for receipts: subtotal, shipping, tax, total. */
export function getReceiptTotals(order, defaults = { taxRate: 13 }) {
  const subtotal =
    order.subtotal != null ? Number(order.subtotal) : itemsSubtotal(order.items);
  const total = Number(order.total || 0);
  const taxRate =
    order.tax_rate != null ? Number(order.tax_rate) : defaults.taxRate;

  if (order.shipping_amount != null && order.tax_amount != null) {
    return {
      subtotal,
      shipping: Number(order.shipping_amount),
      tax: Number(order.tax_amount),
      taxRate,
      total,
    };
  }

  const diff = Math.max(0, total - subtotal);
  const tax = Math.round(subtotal * (taxRate / 100));
  const shipping = Math.max(0, diff - tax);

  return { subtotal, shipping, tax, taxRate, total };
}
