/**
 * Shared URL helpers for the admin orders list — directive-free so both the
 * Server page (pagination) and Client table (header filters) share one builder.
 */

export interface OrdersTableFilters {
  orderNumber: string;
  customer: string;
  phone: string;
  status: string;
  paymentStatus: string;
  userId: string;
  sortBy: string;
  sortDir: string;
}

export function buildOrdersHref(filters: OrdersTableFilters, page?: number): string {
  const params = new URLSearchParams();
  if (filters.orderNumber) params.set("orderNumber", filters.orderNumber);
  if (filters.customer) params.set("customer", filters.customer);
  if (filters.phone) params.set("phone", filters.phone);
  if (filters.status) params.set("status", filters.status);
  if (filters.paymentStatus) params.set("paymentStatus", filters.paymentStatus);
  if (filters.userId) params.set("userId", filters.userId);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortDir) params.set("sortDir", filters.sortDir);
  if (page && page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
}
