"use client";

/**
 * Client-side pagination state for full-load admin managers.
 * Resets to page 1 when `resetKey` changes (e.g. after local filter/search).
 */

import { useState } from "react";
import {
  ADMIN_DEFAULT_PER_PAGE,
  clampPage,
  pageCountOf,
  paginateItems,
  type AdminPerPage,
} from "@/src/lib/admin-pagination";

export function useClientPagination<T>(
  items: readonly T[],
  options?: { resetKey?: string; initialPerPage?: AdminPerPage },
) {
  const initialPerPage = options?.initialPerPage ?? ADMIN_DEFAULT_PER_PAGE;
  const resetKey = options?.resetKey ?? "";
  const [page, setPage] = useState(1);
  const [perPage, setPerPageState] = useState<AdminPerPage>(initialPerPage);
  const [seenResetKey, setSeenResetKey] = useState(resetKey);

  // Reset page when the caller's reset key changes (render-time adjust).
  if (resetKey !== seenResetKey) {
    setSeenResetKey(resetKey);
    setPage(1);
  }

  const pageCount = pageCountOf(items.length, perPage);
  const safePage = clampPage(resetKey !== seenResetKey ? 1 : page, pageCount);

  function setPerPage(next: number) {
    setPerPageState(next as AdminPerPage);
    setPage(1);
  }

  const sliced = paginateItems(items, safePage, perPage);

  return {
    page: sliced.page,
    perPage: sliced.perPage,
    pageCount: sliced.pageCount,
    total: sliced.total,
    items: sliced.items,
    setPage,
    setPerPage,
  };
}
