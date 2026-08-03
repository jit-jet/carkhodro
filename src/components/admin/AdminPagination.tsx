"use client";

/**
 * Reusable admin list pagination — URL (pathname + query) or callback mode.
 * Matches admin table chrome (accent active page, ghost buttons, fa-IR digits).
 *
 * Server pages must pass serializable `pathname` + `query` (never functions).
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Select } from "@/src/components/admin/AdminUI";
import {
  ADMIN_DEFAULT_PER_PAGE,
  ADMIN_PER_PAGE_OPTIONS,
  buildListHref,
  getVisiblePages,
  type AdminPerPage,
} from "@/src/lib/admin-pagination";
import { formatNumberFa } from "@/src/lib/format";

export interface AdminPaginationProps {
  page: number;
  pageCount: number;
  total: number;
  perPage: number;
  /**
   * URL mode (server lists): pathname + filter query without `page`/`perPage`.
   * Serializable — safe to pass from Server Components.
   */
  pathname?: string;
  query?: Record<string, string>;
  /** Callback mode (client lists). */
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  className?: string;
}

function pageButtonClass(active: boolean): string {
  return [
    "min-w-9 h-9 px-2 inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-colors",
    active
      ? "bg-accent text-charcoal"
      : "bg-white border border-gray-200 text-charcoal hover:bg-silver-light",
  ].join(" ");
}

export default function AdminPagination({
  page,
  pageCount,
  total,
  perPage,
  pathname,
  query = {},
  onPageChange,
  onPerPageChange,
  className = "",
}: AdminPaginationProps) {
  const router = useRouter();
  const safePageCount = Math.max(1, pageCount);
  const safePage = Math.min(Math.max(1, page), safePageCount);
  const pages = getVisiblePages(safePage, safePageCount);
  const useLinks = typeof pathname === "string" && pathname.length > 0;

  function hrefFor(nextPage: number, nextPerPage: number = perPage): string {
    return buildListHref(
      pathname!,
      query,
      nextPage,
      nextPerPage,
      ADMIN_DEFAULT_PER_PAGE,
    );
  }

  function goToPage(next: number) {
    if (next < 1 || next > safePageCount || next === safePage) return;
    if (useLinks) {
      router.push(hrefFor(next));
      return;
    }
    onPageChange?.(next);
  }

  function changePerPage(next: number) {
    const value = next as AdminPerPage;
    if (useLinks) {
      router.push(hrefFor(1, value));
      return;
    }
    onPerPageChange?.(value);
  }

  const showPager = safePageCount > 1;

  return (
    <nav
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-5 ${className}`}
      aria-label="صفحه‌بندی"
    >
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
        <span>
          مجموع{" "}
          <span className="font-semibold text-charcoal tabular-nums">
            {formatNumberFa(total)}
          </span>{" "}
          مورد
        </span>
        <label className="inline-flex items-center gap-2">
          <span className="whitespace-nowrap">در هر صفحه</span>
          <Select
            aria-label="تعداد در هر صفحه"
            className="!w-auto !py-1.5 !px-2.5 !rounded-lg min-w-[4.5rem]"
            value={String(perPage)}
            onChange={(e) => changePerPage(Number(e.target.value))}
          >
            {ADMIN_PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n.toLocaleString("fa-IR")}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {showPager ? (
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {useLinks ? (
            <Link
              href={safePage <= 1 ? "#" : hrefFor(safePage - 1)}
              aria-label="صفحه قبل"
              aria-disabled={safePage <= 1}
              tabIndex={safePage <= 1 ? -1 : undefined}
              className={[
                pageButtonClass(false),
                safePage <= 1 ? "pointer-events-none opacity-50" : "",
              ].join(" ")}
              onClick={(e) => {
                if (safePage <= 1) e.preventDefault();
              }}
            >
              قبلی
            </Link>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="!min-w-9 !h-9"
              disabled={safePage <= 1}
              aria-label="صفحه قبل"
              onClick={() => goToPage(safePage - 1)}
            >
              قبلی
            </Button>
          )}

          {pages.map((token, i) =>
            token === "ellipsis" ? (
              <span
                key={`ellipsis-${i}`}
                className="min-w-9 h-9 inline-flex items-center justify-center text-gray-400"
                aria-hidden
              >
                …
              </span>
            ) : useLinks ? (
              <Link
                key={token}
                href={hrefFor(token)}
                aria-label={`صفحه ${token.toLocaleString("fa-IR")}`}
                aria-current={token === safePage ? "page" : undefined}
                className={pageButtonClass(token === safePage)}
              >
                {token.toLocaleString("fa-IR")}
              </Link>
            ) : (
              <Button
                key={token}
                type="button"
                variant="ghost"
                size="sm"
                className={`!min-w-9 !h-9 !px-2 ${
                  token === safePage
                    ? "!bg-accent !text-charcoal !border-transparent hover:!bg-accent"
                    : ""
                }`}
                aria-label={`صفحه ${token.toLocaleString("fa-IR")}`}
                aria-current={token === safePage ? "page" : undefined}
                onClick={() => goToPage(token)}
              >
                {token.toLocaleString("fa-IR")}
              </Button>
            ),
          )}

          {useLinks ? (
            <Link
              href={safePage >= safePageCount ? "#" : hrefFor(safePage + 1)}
              aria-label="صفحه بعد"
              aria-disabled={safePage >= safePageCount}
              tabIndex={safePage >= safePageCount ? -1 : undefined}
              className={[
                pageButtonClass(false),
                safePage >= safePageCount ? "pointer-events-none opacity-50" : "",
              ].join(" ")}
              onClick={(e) => {
                if (safePage >= safePageCount) e.preventDefault();
              }}
            >
              بعدی
            </Link>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="!min-w-9 !h-9"
              disabled={safePage >= safePageCount}
              aria-label="صفحه بعد"
              onClick={() => goToPage(safePage + 1)}
            >
              بعدی
            </Button>
          )}
        </div>
      ) : null}
    </nav>
  );
}
