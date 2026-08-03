"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  bulkUpdateProducts,
  deleteProduct,
  reactivateProduct,
  type BulkProductOp,
} from "@/actions/admin-products";
import type {
  AdminProductListItemVM,
  AdminProductSortBy,
  AdminProductSortDir,
} from "@/actions/products";
import {
  Badge,
  Button,
  FormError,
  FormSuccess,
  Input,
  Select,
  TableShell,
  Toolbar,
  tableBodyClass,
  tableHeadClass,
  tableRowClass,
} from "@/src/components/admin/AdminUI";
import { formatToman, noFormatNumberFa } from "@/src/lib/format";
import {
  buildProductsHref,
  productsFilterKey,
  toAdminProductWhereFilters,
  type ProductsTableFilters,
} from "@/src/lib/admin-products-query";
import { useCartUI } from "@/src/store/cart-ui";

type BulkOpKey =
  | "category"
  | "brand"
  | "vehicleType"
  | "wholesaleDiscount"
  | "retailDiscount"
  | "retailPriceDiff"
  | "setActive"
  | "setOffer"
  | "setCallForPriceRetail"
  | "setCallForPriceWholesale";

const BULK_OPTIONS: { value: BulkOpKey; label: string }[] = [
  { value: "category", label: "تغییر دسته‌بندی" },
  { value: "brand", label: "تغییر برند" },
  { value: "vehicleType", label: "تغییر مدل خودرو" },
  { value: "wholesaleDiscount", label: "تنظیم تخفیف عمده (%)" },
  { value: "retailDiscount", label: "تنظیم تخفیف تک‌فروشی (%)" },
  { value: "retailPriceDiff", label: "تنظیم اختلاف عمده/تک‌فروشی (%)" },
  { value: "setActive", label: "فعال / غیرفعال کردن محصولات" },
  { value: "setOffer", label: "ویژه / غیرویژه کردن محصولات" },
  { value: "setCallForPriceRetail", label: "تماس برای قیمت — تک‌فروشی" },
  { value: "setCallForPriceWholesale", label: "تماس برای قیمت — عمده" },
];

const SELECT_ALL_STORAGE_KEY = "admin-products-select-all-matching";

function SortButton({
  label,
  column,
  sortBy,
  sortDir,
  onSort,
}: {
  label: string;
  column: AdminProductSortBy;
  sortBy: string;
  sortDir: string;
  onSort: (column: AdminProductSortBy) => void;
}) {
  const active = sortBy === column;
  const arrow = !active ? "↕" : sortDir === "asc" ? "↑" : "↓";
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={[
        "inline-flex items-center gap-1 font-semibold whitespace-nowrap",
        active ? "text-charcoal" : "text-gray-500 hover:text-charcoal",
      ].join(" ")}
    >
      {label}
      <span className="text-[10px] opacity-70">{arrow}</span>
    </button>
  );
}

export default function ProductsTable({
  items,
  total,
  filters,
  categories,
  partsBrands,
  carModels,
}: {
  items: AdminProductListItemVM[];
  total: number;
  filters: ProductsTableFilters;
  categories: { id: number; name: string }[];
  partsBrands: { id: number; name: string }[];
  carModels: { id: number; name: string; brandName: string }[];
}) {
  const router = useRouter();
  const notify = useCartUI((s) => s.notify);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  /** When true, every product matching current filters (all pages) is selected. */
  const [selectAllMatching, setSelectAllMatching] = useState(false);
  const [searchDraft, setSearchDraft] = useState(filters.search);
  const [bulkOp, setBulkOp] = useState<BulkOpKey | "">("");
  const [bulkValue, setBulkValue] = useState("");
  const [bulkFlag, setBulkFlag] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const filterKey = productsFilterKey(filters);
  const prevFilterKey = useRef(filterKey);
  const restoredRef = useRef(false);

  // Restore "select all matching" after remounts (e.g. Suspense on page change).
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const raw = sessionStorage.getItem(SELECT_ALL_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { filterKey?: string; selectAllMatching?: boolean };
      if (parsed.filterKey === filterKey && parsed.selectAllMatching) {
        setSelectAllMatching(true);
      }
    } catch {
      /* ignore */
    }
  }, [filterKey]);

  // Clear selection when search/filters change (not on sort or page change).
  useEffect(() => {
    if (prevFilterKey.current === filterKey) return;
    prevFilterKey.current = filterKey;
    setSelected(new Set());
    setSelectAllMatching(false);
    try {
      sessionStorage.removeItem(SELECT_ALL_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [filterKey]);

  useEffect(() => {
    try {
      if (selectAllMatching) {
        sessionStorage.setItem(
          SELECT_ALL_STORAGE_KEY,
          JSON.stringify({ filterKey, selectAllMatching: true }),
        );
      } else {
        sessionStorage.removeItem(SELECT_ALL_STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, [filterKey, selectAllMatching]);

  // Keep search input in sync when filters come from the URL (e.g. back/forward).
  useEffect(() => {
    setSearchDraft(filters.search);
  }, [filters.search]);

  const selectedCount = selectAllMatching ? total : selected.size;
  const allSelected =
    selectAllMatching || (items.length > 0 && items.every((p) => selected.has(p.id)));

  function clearSelection() {
    setSelected(new Set());
    setSelectAllMatching(false);
    try {
      sessionStorage.removeItem(SELECT_ALL_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  function pushFilters(patch: Partial<ProductsTableFilters>) {
    const next = { ...filters, ...patch };
    router.push(buildProductsHref(next));
  }

  function toggleSort(column: AdminProductSortBy) {
    const nextDir: AdminProductSortDir =
      filters.sortBy === column && filters.sortDir === "asc" ? "desc" : "asc";
    pushFilters({ sortBy: column, sortDir: nextDir });
  }

  function toggleAll() {
    if (allSelected) {
      clearSelection();
      return;
    }
    // Select every product matching current filters across all pages.
    setSelectAllMatching(true);
    setSelected(new Set());
  }

  function toggleOne(id: string) {
    if (selectAllMatching) {
      // Leave "all matching" mode: keep the current page selected except this row.
      setSelectAllMatching(false);
      setSelected(new Set(items.map((p) => p.id).filter((rowId) => rowId !== id)));
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function isRowSelected(id: string) {
    return selectAllMatching || selected.has(id);
  }

  function needsValueInput(op: BulkOpKey | ""): boolean {
    return (
      op === "category" ||
      op === "brand" ||
      op === "vehicleType" ||
      op === "wholesaleDiscount" ||
      op === "retailDiscount" ||
      op === "retailPriceDiff"
    );
  }

  function buildBulkAction(): BulkProductOp | null {
    if (!bulkOp) return null;
    switch (bulkOp) {
      case "category":
        return { op: "category", categoryId: Number(bulkValue) };
      case "brand":
        return { op: "brand", partsBrandId: Number(bulkValue) };
      case "vehicleType":
        return { op: "vehicleType", carModelId: Number(bulkValue) };
      case "wholesaleDiscount":
        return { op: "wholesaleDiscount", value: Number(bulkValue) };
      case "retailDiscount":
        return { op: "retailDiscount", value: Number(bulkValue) };
      case "retailPriceDiff":
        return { op: "retailPriceDiff", value: Number(bulkValue) };
      case "setActive":
        return { op: "setActive", isActive: bulkFlag };
      case "setOffer":
        return { op: "setOffer", isOffer: bulkFlag };
      case "setCallForPriceRetail":
        return { op: "setCallForPriceRetail", callForPriceRetail: bulkFlag };
      case "setCallForPriceWholesale":
        return { op: "setCallForPriceWholesale", callForPriceWholesale: bulkFlag };
      default:
        return null;
    }
  }

  function handleBulkSubmit() {
    setError("");
    setMessage("");
    if (selectedCount === 0) {
      const msg = "حداقل یک محصول را انتخاب کنید.";
      setError(msg);
      notify({ variant: "error", title: "خطا", description: msg });
      return;
    }
    if (!bulkOp) {
      const msg = "یک عملیات گروهی انتخاب کنید.";
      setError(msg);
      notify({ variant: "error", title: "خطا", description: msg });
      return;
    }
    if (needsValueInput(bulkOp) && !bulkValue) {
      const msg = "مقدار عملیات را وارد یا انتخاب کنید.";
      setError(msg);
      notify({ variant: "error", title: "خطا", description: msg });
      return;
    }

    const action = buildBulkAction();
    if (!action) {
      const msg = "عملیات گروهی نامعتبر است.";
      setError(msg);
      notify({ variant: "error", title: "خطا", description: msg });
      return;
    }
    if (
      (action.op === "category" || action.op === "brand" || action.op === "vehicleType") &&
      !Number.isFinite(
        action.op === "category"
          ? action.categoryId
          : action.op === "brand"
            ? action.partsBrandId
            : action.carModelId,
      )
    ) {
      const msg = "گزینه انتخاب‌شده معتبر نیست.";
      setError(msg);
      notify({ variant: "error", title: "خطا", description: msg });
      return;
    }

    startTransition(async () => {
      const target = selectAllMatching
        ? { mode: "filters" as const, filters: toAdminProductWhereFilters(filters) }
        : { mode: "ids" as const, productIds: Array.from(selected) };
      const result = await bulkUpdateProducts(target, action);
      if (!result.ok) {
        setError(result.error);
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }
      const successMessage = `${result.data.count.toLocaleString("fa-IR")} محصول با موفقیت به‌روزرسانی شد.`;
      setMessage(successMessage);
      notify({ variant: "success", title: "ذخیره موفق", description: successMessage });
      clearSelection();
      setBulkValue("");
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    setError("");
    startTransition(async () => {
      const result = await deleteProduct(id);
      if (!result.ok) {
        setError(result.error);
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }
      notify({
        variant: "success",
        title: "غیرفعال شد",
        description: "محصول با موفقیت غیرفعال شد.",
      });
      router.refresh();
    });
  }

  function handleReactivate(id: string) {
    setError("");
    startTransition(async () => {
      const result = await reactivateProduct(id);
      if (!result.ok) {
        setError(result.error);
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }
      notify({
        variant: "success",
        title: "فعال‌سازی موفق",
        description: "محصول با موفقیت فعال شد.",
      });
      router.refresh();
    });
  }

  /** Keep header filters as wide as the column — do not inflate cells via min-width. */
  const headerSelectClass = "!py-1.5 !px-2 !text-xs !rounded-lg w-full max-w-full";
  const thClass = "text-right px-1.5 py-3 align-bottom";
  const tdClass = "px-1.5 py-3";

  return (
    <div className="space-y-3 min-w-0">
      <Toolbar tone="accent">
        <span className="text-sm font-semibold text-charcoal">
          {selectedCount > 0
            ? selectAllMatching
              ? `${selectedCount.toLocaleString("fa-IR")} مورد انتخاب شده (همه نتایج فیلتر)`
              : `${selectedCount.toLocaleString("fa-IR")} مورد انتخاب شده`
            : "عملیات گروهی"}
        </span>
        <Select
          value={bulkOp}
          onChange={(e) => {
            setBulkOp(e.target.value as BulkOpKey | "");
            setBulkValue("");
            setBulkFlag(true);
          }}
          className="w-auto min-w-[220px]"
        >
          <option value="">انتخاب عملیات…</option>
          {BULK_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>

        {bulkOp === "category" && (
          <Select
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
            className="w-auto min-w-[180px]"
          >
            <option value="">انتخاب دسته‌بندی…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        )}

        {bulkOp === "brand" && (
          <Select
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
            className="w-auto min-w-[180px]"
          >
            <option value="">انتخاب برند…</option>
            {partsBrands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        )}

        {bulkOp === "vehicleType" && (
          <Select
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
            className="w-auto min-w-[200px]"
          >
            <option value="">انتخاب مدل خودرو…</option>
            {carModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.brandName} — {m.name}
              </option>
            ))}
          </Select>
        )}

        {(bulkOp === "wholesaleDiscount" ||
          bulkOp === "retailDiscount" ||
          bulkOp === "retailPriceDiff") && (
          <Input
            type="number"
            min={0}
            max={100}
            step={0.01}
            placeholder="درصد…"
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
            className="w-28"
          />
        )}

        {bulkOp === "setActive" && (
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal cursor-pointer select-none">
            <input
              type="checkbox"
              checked={bulkFlag}
              onChange={(e) => setBulkFlag(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            {bulkFlag ? "فعال" : "غیرفعال"}
          </label>
        )}

        {bulkOp === "setOffer" && (
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal cursor-pointer select-none">
            <input
              type="checkbox"
              checked={bulkFlag}
              onChange={(e) => setBulkFlag(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            {bulkFlag ? "ویژه" : "غیرویژه"}
          </label>
        )}

        {bulkOp === "setCallForPriceRetail" && (
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal cursor-pointer select-none">
            <input
              type="checkbox"
              checked={bulkFlag}
              onChange={(e) => setBulkFlag(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            {bulkFlag ? "فعال کردن تماس برای قیمت (تک‌فروشی)" : "غیرفعال کردن تماس برای قیمت (تک‌فروشی)"}
          </label>
        )}

        {bulkOp === "setCallForPriceWholesale" && (
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal cursor-pointer select-none">
            <input
              type="checkbox"
              checked={bulkFlag}
              onChange={(e) => setBulkFlag(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            {bulkFlag ? "فعال کردن تماس برای قیمت (عمده)" : "غیرفعال کردن تماس برای قیمت (عمده)"}
          </label>
        )}

        <Button type="button" size="sm" onClick={handleBulkSubmit} disabled={pending}>
          ثبت تغییرات
        </Button>
      </Toolbar>

      {error && <FormError message={error} />}
      {message && <FormSuccess message={message} />}

      <TableShell minWidth="min-w-0" tableClassName="table-fixed w-full">
            <thead className={tableHeadClass}>
              <tr>
                <th className="w-8 px-1.5 py-3 align-bottom">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    disabled={total === 0}
                    title="انتخاب همه محصولات فیلترشده در تمام صفحات"
                    className="w-4 h-4 accent-accent"
                  />
                </th>
                <th className={`${thClass} w-[16%]`}>
                  <div className="flex flex-col gap-1.5 items-stretch min-w-0">
                    <SortButton
                      label="محصول"
                      column="name"
                      sortBy={filters.sortBy}
                      sortDir={filters.sortDir}
                      onSort={toggleSort}
                    />
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        pushFilters({ search: searchDraft.trim() });
                      }}
                    >
                      <Input
                        value={searchDraft}
                        onChange={(e) => setSearchDraft(e.target.value)}
                        placeholder="جستجو…"
                        className="!py-1.5 !px-2 !text-xs !rounded-lg"
                      />
                    </form>
                  </div>
                </th>
                <th className={`${thClass} w-[9%]`}>
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <SortButton
                      label="دسته‌بندی"
                      column="category"
                      sortBy={filters.sortBy}
                      sortDir={filters.sortDir}
                      onSort={toggleSort}
                    />
                    <Select
                      value={filters.categoryId}
                      onChange={(e) => pushFilters({ categoryId: e.target.value })}
                      className={headerSelectClass}
                    >
                      <option value="">همه</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </th>
                <th className={`${thClass} w-[8%]`}>
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <SortButton
                      label="نوع برند"
                      column="partsBrand"
                      sortBy={filters.sortBy}
                      sortDir={filters.sortDir}
                      onSort={toggleSort}
                    />
                    <Select
                      value={filters.partsBrandId}
                      onChange={(e) => pushFilters({ partsBrandId: e.target.value })}
                      className={headerSelectClass}
                    >
                      <option value="">همه</option>
                      {partsBrands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </th>
                <th className={`${thClass} w-[9%]`}>
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <span className="font-semibold text-gray-500 whitespace-nowrap">مدل خودرو</span>
                    <Select
                      value={filters.carModelId}
                      onChange={(e) => pushFilters({ carModelId: e.target.value })}
                      className={headerSelectClass}
                    >
                      <option value="">همه</option>
                      {carModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.brandName} — {m.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </th>
                <th className={`${thClass} w-[9%] whitespace-nowrap`}>
                  <SortButton
                    label="قیمت عمده"
                    column="wholesalePrice"
                    sortBy={filters.sortBy}
                    sortDir={filters.sortDir}
                    onSort={toggleSort}
                  />
                </th>
                <th className={`${thClass} w-[9%] whitespace-nowrap`}>
                  <SortButton
                    label="قیمت تک‌فروشی"
                    column="retailPrice"
                    sortBy={filters.sortBy}
                    sortDir={filters.sortDir}
                    onSort={toggleSort}
                  />
                </th>
                <th className={`${thClass} w-[5%] whitespace-nowrap`}>
                  <SortButton
                    label="موجودی"
                    column="stock"
                    sortBy={filters.sortBy}
                    sortDir={filters.sortDir}
                    onSort={toggleSort}
                  />
                </th>
                <th className={`${thClass} w-[7%]`}>
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <SortButton
                      label="وضعیت"
                      column="isActive"
                      sortBy={filters.sortBy}
                      sortDir={filters.sortDir}
                      onSort={toggleSort}
                    />
                    <Select
                      value={filters.status}
                      onChange={(e) => pushFilters({ status: e.target.value })}
                      className={headerSelectClass}
                    >
                      <option value="">همه</option>
                      <option value="active">فعال</option>
                      <option value="inactive">غیرفعال</option>
                    </Select>
                  </div>
                </th>
                <th className={`${thClass} w-[6%]`}>
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <SortButton
                      label="ویژه"
                      column="isOffer"
                      sortBy={filters.sortBy}
                      sortDir={filters.sortDir}
                      onSort={toggleSort}
                    />
                    <Select
                      value={filters.offer}
                      onChange={(e) => pushFilters({ offer: e.target.value })}
                      className={headerSelectClass}
                    >
                      <option value="">همه</option>
                      <option value="special">ویژه</option>
                      <option value="normal">عادی</option>
                    </Select>
                  </div>
                </th>
                <th
                  className={`${thClass} w-[7%]`}
                  title="تماس برای قیمت — تک‌فروشی / عمده"
                >
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <span className="font-semibold text-gray-500 whitespace-nowrap">تماس</span>
                    <Select
                      value={filters.callForPrice}
                      onChange={(e) => pushFilters({ callForPrice: e.target.value })}
                      className={headerSelectClass}
                    >
                      <option value="">همه</option>
                      <option value="retail">تک‌فروشی</option>
                      <option value="wholesale">عمده</option>
                      <option value="any">فعال</option>
                      <option value="none">بدون تماس</option>
                    </Select>
                  </div>
                </th>
                <th className="px-1.5 py-3 w-[10%]"></th>
              </tr>
            </thead>
            <tbody className={tableBodyClass}>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-gray-400">
                    محصولی با این فیلترها یافت نشد.
                  </td>
                </tr>
              ) : (
                items.map((p) => (
                  <tr
                    key={p.id}
                    className={`${tableRowClass} ${isRowSelected(p.id) ? "bg-amber-50/60" : ""}`}
                  >
                    <td className={tdClass}>
                      <input
                        type="checkbox"
                        checked={isRowSelected(p.id)}
                        onChange={() => toggleOne(p.id)}
                        className="w-4 h-4 accent-accent"
                      />
                    </td>
                    <td className={`${tdClass} min-w-0`}>
                      <p className="font-semibold text-charcoal truncate" title={p.name}>
                        {p.name}
                      </p>
                      <p className="text-xs text-gray-400 font-mono truncate" title={p.sku}>
                        {p.sku}
                      </p>
                    </td>
                    <td className={`${tdClass} text-gray-500 truncate`} title={p.categoryName}>
                      {p.categoryName}
                    </td>
                    <td className={`${tdClass} text-gray-500 truncate`} title={p.partsBrandName}>
                      {p.partsBrandName}
                    </td>
                    <td
                      className={`${tdClass} text-gray-500 truncate`}
                      title={p.carType || undefined}
                    >
                      {p.carType || "—"}
                    </td>
                    <td className={`${tdClass} tabular-nums text-sm`}>
                      <span className="block truncate" title={formatToman(p.wholesaleFinal)}>
                        {formatToman(p.wholesaleFinal)}
                      </span>
                      {p.wholesaleDiscountPct > 0 && (
                        <span className="block text-xs text-red-500">
                          ٪{noFormatNumberFa(p.wholesaleDiscountPct)}
                        </span>
                      )}
                    </td>
                    <td className={`${tdClass} tabular-nums text-sm`}>
                      <span className="block truncate" title={formatToman(p.retailFinal)}>
                        {formatToman(p.retailFinal)}
                      </span>
                      {p.retailDiscountPct > 0 && (
                        <span className="block text-xs text-red-500">
                          ٪{noFormatNumberFa(p.retailDiscountPct)}
                        </span>
                      )}
                    </td>
                    <td className={`${tdClass} whitespace-nowrap`}>
                      <span className={p.stock === 0 ? "text-red-600 font-semibold" : "text-gray-600"}>
                        {noFormatNumberFa(p.stock)}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <Badge tone={p.isActive ? "success" : "default"}>
                        {p.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                    </td>
                    <td className={tdClass}>
                      <Badge tone={p.isOffer ? "warning" : "default"}>
                        {p.isOffer ? "ویژه" : "عادی"}
                      </Badge>
                    </td>
                    <td className={tdClass}>
                      <div className="flex flex-wrap gap-0.5">
                        {p.callForPriceRetail ? (
                          <span
                            className="inline-flex items-center rounded px-1 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800"
                            title="تماس برای قیمت — تک‌فروشی"
                          >
                            تک
                          </span>
                        ) : null}
                        {p.callForPriceWholesale ? (
                          <span
                            className="inline-flex items-center rounded px-1 py-0.5 text-[10px] font-bold bg-sky-100 text-sky-800"
                            title="تماس برای قیمت — عمده"
                          >
                            عمده
                          </span>
                        ) : null}
                        {!p.callForPriceRetail && !p.callForPriceWholesale ? (
                          <span className="text-xs text-gray-300">—</span>
                        ) : null}
                      </div>
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-bold text-charcoal hover:bg-silver-light transition-colors"
                        >
                          ویرایش
                        </Link>
                        {p.isActive ? (
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(p.id)}
                            disabled={pending}
                          >
                            غیرفعال
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReactivate(p.id)}
                            disabled={pending}
                            className="!text-green-700 !border-green-200 hover:!bg-green-50"
                          >
                            فعال‌سازی
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
      </TableShell>
    </div>
  );
}
