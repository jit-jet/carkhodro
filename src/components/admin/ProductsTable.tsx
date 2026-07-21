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

type BulkOpKey =
  | "category"
  | "brand"
  | "vehicleType"
  | "wholesaleDiscount"
  | "retailDiscount"
  | "retailPriceDiff"
  | "setActive"
  | "setOffer";

const BULK_OPTIONS: { value: BulkOpKey; label: string }[] = [
  { value: "category", label: "تغییر دسته‌بندی" },
  { value: "brand", label: "تغییر برند" },
  { value: "vehicleType", label: "تغییر نوع خودرو" },
  { value: "wholesaleDiscount", label: "تنظیم تخفیف عمده (%)" },
  { value: "retailDiscount", label: "تنظیم تخفیف تک‌فروشی (%)" },
  { value: "retailPriceDiff", label: "تنظیم اختلاف عمده/تک‌فروشی (%)" },
  { value: "setActive", label: "فعال / غیرفعال کردن محصولات" },
  { value: "setOffer", label: "ویژه / غیرویژه کردن محصولات" },
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
      default:
        return null;
    }
  }

  function handleBulkSubmit() {
    setError("");
    setMessage("");
    if (selectedCount === 0) return setError("حداقل یک محصول را انتخاب کنید.");
    if (!bulkOp) return setError("یک عملیات گروهی انتخاب کنید.");
    if (needsValueInput(bulkOp) && !bulkValue) {
      return setError("مقدار عملیات را وارد یا انتخاب کنید.");
    }

    const action = buildBulkAction();
    if (!action) return setError("عملیات گروهی نامعتبر است.");
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
      return setError("گزینه انتخاب‌شده معتبر نیست.");
    }

    startTransition(async () => {
      const target = selectAllMatching
        ? { mode: "filters" as const, filters: toAdminProductWhereFilters(filters) }
        : { mode: "ids" as const, productIds: Array.from(selected) };
      const result = await bulkUpdateProducts(target, action);
      if (!result.ok) return setError(result.error);
      setMessage(`${result.data.count.toLocaleString("fa-IR")} محصول با موفقیت به‌روزرسانی شد.`);
      clearSelection();
      setBulkValue("");
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    setError("");
    startTransition(async () => {
      const result = await deleteProduct(id);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  function handleReactivate(id: string) {
    setError("");
    startTransition(async () => {
      const result = await reactivateProduct(id);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  const headerSelectClass = "!py-1.5 !text-xs !rounded-lg min-w-[120px]";

  return (
    <div className="space-y-3">
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
            <option value="">انتخاب نوع خودرو…</option>
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

        <Button type="button" size="sm" onClick={handleBulkSubmit} disabled={pending}>
          ثبت تغییرات
        </Button>
      </Toolbar>

      {error && <FormError message={error} />}
      {message && <FormSuccess message={message} />}

      <TableShell minWidth="min-w-[1200px]">
            <thead className={tableHeadClass}>
              <tr>
                <th className="px-4 py-3 align-bottom">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    disabled={total === 0}
                    title="انتخاب همه محصولات فیلترشده در تمام صفحات"
                    className="w-4 h-4 accent-accent"
                  />
                </th>
                <th className="text-right px-4 py-3 align-bottom">
                  <div className="flex flex-col gap-1.5 items-stretch">
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
                        className="!py-1.5 !text-xs !rounded-lg"
                      />
                    </form>
                  </div>
                </th>
                <th className="text-right px-4 py-3 align-bottom">
                  <div className="flex flex-col gap-1.5">
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
                <th className="text-right px-4 py-3 align-bottom">
                  <div className="flex flex-col gap-1.5">
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
                <th className="text-right px-4 py-3 align-bottom">
                  <div className="flex flex-col gap-1.5">
                    <span className="font-semibold text-gray-500">نوع خودرو</span>
                    <Select
                      value={filters.carModelId}
                      onChange={(e) => pushFilters({ carModelId: e.target.value })}
                      className={headerSelectClass}
                    >
                      <option value="">همه</option>
                      {carModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </th>
                <th className="text-right px-4 py-3 align-bottom">
                  <SortButton
                    label="قیمت عمده"
                    column="wholesalePrice"
                    sortBy={filters.sortBy}
                    sortDir={filters.sortDir}
                    onSort={toggleSort}
                  />
                </th>
                <th className="text-right px-4 py-3 align-bottom">
                  <SortButton
                    label="قیمت تک‌فروشی"
                    column="retailPrice"
                    sortBy={filters.sortBy}
                    sortDir={filters.sortDir}
                    onSort={toggleSort}
                  />
                </th>
                <th className="text-right px-4 py-3 align-bottom">
                  <SortButton
                    label="موجودی"
                    column="stock"
                    sortBy={filters.sortBy}
                    sortDir={filters.sortDir}
                    onSort={toggleSort}
                  />
                </th>
                <th className="text-right px-4 py-3 align-bottom">
                  <div className="flex flex-col gap-1.5">
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
                <th className="text-right px-4 py-3 align-bottom">
                  <div className="flex flex-col gap-1.5">
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
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className={tableBodyClass}>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-gray-400">
                    محصولی با این فیلترها یافت نشد.
                  </td>
                </tr>
              ) : (
                items.map((p) => (
                  <tr
                    key={p.id}
                    className={`${tableRowClass} ${isRowSelected(p.id) ? "bg-amber-50/60" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isRowSelected(p.id)}
                        onChange={() => toggleOne(p.id)}
                        className="w-4 h-4 accent-accent"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-charcoal">{p.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.categoryName}</td>
                    <td className="px-4 py-3 text-gray-500">{p.partsBrandName}</td>
                    <td className="px-4 py-3 text-gray-500">{p.carType || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                      {formatToman(p.wholesaleFinal)}
                      {p.wholesaleDiscountPct > 0 && (
                        <span className="text-xs text-red-500 mr-1">
                          (٪{noFormatNumberFa(p.wholesaleDiscountPct)})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                      {formatToman(p.retailFinal)}
                      {p.retailDiscountPct > 0 && (
                        <span className="text-xs text-red-500 mr-1">
                          (٪{noFormatNumberFa(p.retailDiscountPct)})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={p.stock === 0 ? "text-red-600 font-semibold" : "text-gray-600"}>
                        {noFormatNumberFa(p.stock)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={p.isActive ? "success" : "default"}>
                        {p.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={p.isOffer ? "warning" : "default"}>
                        {p.isOffer ? "ویژه" : "عادی"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-charcoal hover:bg-silver-light transition-colors"
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
