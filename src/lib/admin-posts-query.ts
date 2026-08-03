/**
 * Shared URL helpers for the admin posts list.
 */

import {
  ADMIN_DEFAULT_PER_PAGE,
  appendPaginationParams,
} from "@/src/lib/admin-pagination";

export interface PostsTableFilters {
  search: string;
  status: string;
  categoryId: string;
  perPage: number;
}

export function buildPostsHref(filters: PostsTableFilters, page?: number): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  appendPaginationParams(params, page, filters.perPage, ADMIN_DEFAULT_PER_PAGE);
  const qs = params.toString();
  return qs ? `/admin/posts?${qs}` : "/admin/posts";
}
