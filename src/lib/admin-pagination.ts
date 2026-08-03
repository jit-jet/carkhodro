/**
 * Shared admin list pagination helpers — directive-free so server pages,
 * client tables, and URL builders can all reuse the same math and defaults.
 */

export const ADMIN_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;
export type AdminPerPage = (typeof ADMIN_PER_PAGE_OPTIONS)[number];
export const ADMIN_DEFAULT_PER_PAGE: AdminPerPage = 20;

export type PageToken = number | "ellipsis";

/** Pick the first string value from a Next.js searchParams entry. */
export function pickSearchParam(
  value: string | string[] | undefined,
): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function parsePage(value: string | string[] | undefined): number {
  const n = Number(pickSearchParam(value));
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export function parsePerPage(
  value: string | string[] | undefined,
  fallback: AdminPerPage = ADMIN_DEFAULT_PER_PAGE,
): AdminPerPage {
  const n = Number(pickSearchParam(value));
  return (ADMIN_PER_PAGE_OPTIONS as readonly number[]).includes(n)
    ? (n as AdminPerPage)
    : fallback;
}

export function pageCountOf(total: number, perPage: number): number {
  if (total <= 0) return 1;
  return Math.max(1, Math.ceil(total / perPage));
}

export function clampPage(page: number, pageCount: number): number {
  if (pageCount < 1) return 1;
  return Math.min(Math.max(1, page), pageCount);
}

/** Slice a full in-memory list for client-side pagination. */
export function paginateItems<T>(
  items: readonly T[],
  page: number,
  perPage: number,
): { items: T[]; page: number; pageCount: number; total: number; perPage: number } {
  const total = items.length;
  const pageCount = pageCountOf(total, perPage);
  const safePage = clampPage(page, pageCount);
  const start = (safePage - 1) * perPage;
  return {
    items: items.slice(start, start + perPage) as T[],
    page: safePage,
    pageCount,
    total,
    perPage,
  };
}

/**
 * Build the window of page numbers with ellipsis for large page counts.
 * Always includes first, last, and neighbors around the active page.
 */
export function getVisiblePages(page: number, pageCount: number): PageToken[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const set = new Set<number>();
  set.add(1);
  set.add(pageCount);
  for (let p = page - 1; p <= page + 1; p++) {
    if (p >= 1 && p <= pageCount) set.add(p);
  }
  // Keep the window denser near the edges
  if (page <= 3) {
    set.add(2);
    set.add(3);
    set.add(4);
  }
  if (page >= pageCount - 2) {
    set.add(pageCount - 1);
    set.add(pageCount - 2);
    set.add(pageCount - 3);
  }

  const sorted = [...set].sort((a, b) => a - b);
  const result: PageToken[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i]!;
    const prev = sorted[i - 1];
    if (prev !== undefined && current - prev > 1) {
      result.push("ellipsis");
    }
    result.push(current);
  }
  return result;
}

/** Append page / perPage to a URLSearchParams bag (omit defaults). */
export function appendPaginationParams(
  params: URLSearchParams,
  page?: number,
  perPage?: number,
  defaultPerPage: AdminPerPage = ADMIN_DEFAULT_PER_PAGE,
): void {
  if (page && page > 1) params.set("page", String(page));
  if (perPage && perPage !== defaultPerPage) params.set("perPage", String(perPage));
}

/**
 * Build a list URL from a pathname + serializable query bag.
 * Used by the client AdminPagination so server pages never pass functions.
 */
export function buildListHref(
  pathname: string,
  query: Record<string, string>,
  page?: number,
  perPage?: number,
  defaultPerPage: AdminPerPage = ADMIN_DEFAULT_PER_PAGE,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  appendPaginationParams(params, page, perPage, defaultPerPage);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
