export type OrderPeriodFilter = 'all' | 'month' | '3months' | 'year';

export const ORDER_PERIOD_LABELS: Record<OrderPeriodFilter, string> = {
  all: 'All',
  month: 'This Month',
  '3months': 'Past 3 Months',
  year: 'This Year',
};

export function matchesOrderPeriod(createdAt: string | undefined, period: OrderPeriodFilter): boolean {
  if (period === 'all') return true;
  if (!createdAt) return false;

  const orderDate = new Date(createdAt);
  if (Number.isNaN(orderDate.getTime())) return false;

  const now = new Date();

  if (period === 'month') {
    return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
  }

  if (period === '3months') {
    const start = new Date(now);
    start.setMonth(now.getMonth() - 3);
    start.setHours(0, 0, 0, 0);
    return orderDate >= start;
  }

  if (period === 'year') {
    return orderDate.getFullYear() === now.getFullYear();
  }

  return true;
}
