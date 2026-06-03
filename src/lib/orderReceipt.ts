import { displayOrderId } from './orderId';

export type ReceiptShippingAddress = {
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
};

export type ReceiptOrderItem = {
  id: number;
  quantity: number;
  price: number;
  product?: { name?: string };
};

export type ReceiptOrder = {
  id: number;
  order_uid?: string;
  customer_name: string;
  customer_email: string;
  total: number;
  subtotal?: number;
  shipping_amount?: number;
  tax_amount?: number;
  tax_rate?: number;
  status: string;
  payment_method?: string;
  shipping_address?: ReceiptShippingAddress;
  created_at: string;
  items: ReceiptOrderItem[];
};

export function itemsSubtotal(items: ReceiptOrderItem[]): number {
  return (items || []).reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
}

export function getReceiptTotals(order: ReceiptOrder, defaults: { taxRate?: number } = {}) {
  const taxRateDefault = defaults.taxRate ?? 13;
  const subtotal =
    order.subtotal != null ? Number(order.subtotal) : itemsSubtotal(order.items);
  const total = Number(order.total || 0);
  const taxRate = order.tax_rate != null ? Number(order.tax_rate) : taxRateDefault;

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

export function formatPaymentMethod(method?: string): string {
  if (!method) return 'Cash on Delivery';
  const map: Record<string, string> = {
    cod: 'Cash on Delivery',
    'Cash on Delivery': 'Cash on Delivery',
    eSewa: 'eSewa',
    Khalti: 'Khalti',
    'Bank Transfer': 'Bank Transfer',
    'Credit / Debit Card': 'Credit / Debit Card',
  };
  return map[method] || method;
}

function formatMoney(amount: number): string {
  return `NPR ${Number(amount || 0).toLocaleString('en-IN')}`;
}

function formatReceiptDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shippingLines(shipping?: ReceiptShippingAddress): string[] {
  if (!shipping) return [];
  const lines: string[] = [];
  if (shipping.address) lines.push(shipping.address);
  const cityLine = [shipping.city, shipping.state, shipping.zip].filter(Boolean).join(', ');
  if (cityLine) lines.push(cityLine);
  if (shipping.phone) lines.push(`Phone: ${shipping.phone}`);
  return lines;
}

function drawRule(doc: import('jspdf').jsPDF, y: number, margin: number, width: number) {
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, width - margin, y);
}

function drawSummaryLine(
  doc: import('jspdf').jsPDF,
  y: number,
  colUnit: number,
  colTotal: number,
  label: string,
  value: string,
  bold = false
) {
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(bold ? 12 : 10);
  doc.text(label, colUnit, y);
  doc.text(value, colTotal, y);
}

export async function downloadOrderReceiptPdf(order: ReceiptOrder, storeName = 'Dwarika') {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 18;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;
  let y = 22;

  const orderId = displayOrderId(order);
  const totals = getReceiptTotals(order);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(30, 30, 30);
  doc.text(storeName.toUpperCase(), pageWidth / 2, y, { align: 'center' });

  y += 8;
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text('ORDER RECEIPT', pageWidth / 2, y, { align: 'center' });

  y += 10;
  drawRule(doc, y, margin, pageWidth);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const metaLeft = [
    `Order ID: ${orderId}`,
    `Date: ${formatReceiptDate(order.created_at)}`,
    `Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`,
    `Payment: ${formatPaymentMethod(order.payment_method)}`,
  ];
  metaLeft.forEach((line) => {
    doc.text(line, margin, y);
    y += 5.5;
  });

  y += 4;
  drawRule(doc, y, margin, pageWidth);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('BILL TO', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(order.customer_name || '-', margin, y);
  y += 5;
  doc.text(order.customer_email || '-', margin, y);
  y += 8;

  const ship = shippingLines(order.shipping_address);
  if (ship.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('SHIP TO', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    ship.forEach((line) => {
      doc.text(line, margin, y);
      y += 5;
    });
    y += 4;
  }

  drawRule(doc, y, margin, pageWidth);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  const colItem = margin;
  const colQty = margin + contentWidth * 0.55;
  const colUnit = margin + contentWidth * 0.68;
  const colTotal = margin + contentWidth * 0.82;
  doc.text('ITEM', colItem, y);
  doc.text('QTY', colQty, y);
  doc.text('UNIT', colUnit, y);
  doc.text('TOTAL', colTotal, y);
  y += 4;
  drawRule(doc, y, margin, pageWidth);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);

  (order.items || []).forEach((item) => {
    const name = item.product?.name || 'Product';
    const qty = String(item.quantity || 0);
    const unit = formatMoney(Number(item.price || 0));
    const lineTotal = formatMoney(Number(item.price || 0) * Number(item.quantity || 0));
    const wrapped = doc.splitTextToSize(name, contentWidth * 0.5);

    if (y + wrapped.length * 5 > 270) {
      doc.addPage();
      y = 22;
    }

    doc.text(wrapped, colItem, y);
    doc.text(qty, colQty, y);
    doc.text(unit, colUnit, y);
    doc.text(lineTotal, colTotal, y);
    y += Math.max(6, wrapped.length * 5);
  });

  if (!order.items?.length) {
    doc.text('No items recorded', colItem, y);
    y += 6;
  }

  y += 4;
  drawRule(doc, y, margin, pageWidth);
  y += 8;

  doc.setTextColor(40, 40, 40);
  drawSummaryLine(doc, y, colUnit, colTotal, 'Subtotal', formatMoney(totals.subtotal));
  y += 7;
  drawSummaryLine(
    doc,
    y,
    colUnit,
    colTotal,
    'Shipping',
    totals.shipping === 0 ? 'Free' : formatMoney(totals.shipping)
  );
  y += 7;
  drawSummaryLine(doc, y, colUnit, colTotal, `Tax (${totals.taxRate}%)`, formatMoney(totals.tax));
  y += 7;
  drawSummaryLine(doc, y, colUnit, colTotal, 'TOTAL', formatMoney(totals.total), true);

  y += 14;
  drawRule(doc, y, margin, pageWidth);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Thank you for shopping with ${storeName}.`, pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text('This is a computer-generated receipt.', pageWidth / 2, y, { align: 'center' });

  doc.save(`receipt-${orderId}.pdf`);
}
