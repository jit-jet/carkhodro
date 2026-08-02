/**
 * Shared URL helpers for the admin users list — directive-free so both the
 * Server page (pagination links) and the Client table (header filters) can
 * build the same query string.
 */

import {
  ADMIN_DEFAULT_PER_PAGE,
  appendPaginationParams,
} from "@/src/lib/admin-pagination";

export interface UsersTableFilters {
  search: string;
  phone: string;
  role: string;
  status: string;
  sortBy: string;
  sortDir: string;
  perPage: number;
}

export function buildUsersHref(filters: UsersTableFilters, page?: number): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.phone) params.set("phone", filters.phone);
  if (filters.role) params.set("role", filters.role);
  if (filters.status) params.set("status", filters.status);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortDir) params.set("sortDir", filters.sortDir);
  appendPaginationParams(
    params,
    page,
    filters.perPage,
    ADMIN_DEFAULT_PER_PAGE,
  );
  const qs = params.toString();
  return qs ? `/admin/users?${qs}` : "/admin/users";
}
