/**
 * Shared URL helpers for the admin communications panel.
 */

import {
  ADMIN_DEFAULT_PER_PAGE,
  appendPaginationParams,
} from "@/src/lib/admin-pagination";

export type CommunicationsTab = "reviews" | "support" | "suggestions";

export interface CommunicationsFilters {
  tab: CommunicationsTab;
  unreadOnly: boolean;
  perPage: number;
}

export function buildCommunicationsHref(
  filters: CommunicationsFilters,
  page?: number,
): string {
  const params = new URLSearchParams();
  if (filters.tab !== "reviews") params.set("tab", filters.tab);
  if (filters.unreadOnly) params.set("unread", "1");
  appendPaginationParams(params, page, filters.perPage, ADMIN_DEFAULT_PER_PAGE);
  const qs = params.toString();
  return qs ? `/admin/communications?${qs}` : "/admin/communications";
}
