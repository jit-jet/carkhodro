/**
 * Shared URL helpers for the admin discount-codes list.
 */

import {
  ADMIN_DEFAULT_PER_PAGE,
  appendPaginationParams,
} from "@/src/lib/admin-pagination";

export interface DiscountCodesTableFilters {
  search: string;
  status: string;
  type: string;
  perPage: number;
}

export function buildDiscountCodesHref(
  filters: DiscountCodesTableFilters,
  page?: number,
): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.type && filters.type !== "all") params.set("type", filters.type);
  appendPaginationParams(params, page, filters.perPage, ADMIN_DEFAULT_PER_PAGE);
  const qs = params.toString();
  return qs ? `/admin/discount-codes?${qs}` : "/admin/discount-codes";
}
