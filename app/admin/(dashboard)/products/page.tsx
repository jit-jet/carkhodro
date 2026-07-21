import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getProductsAdmin, type AdminProductSortBy, type AdminProductSortDir } from "@/actions/products";
import { getCategories } from "@/actions/categories";
import { getPartsBrands, getCarModelsAdmin } from "@/actions/brands";
import { PageHeader, Button } from "@/src/components/admin/AdminUI";
import ProductsTable from "@/src/components/admin/ProductsTable";
import { buildProductsHref } from "@/src/lib/admin-products-query";
import { formatNumberFa } from "@/src/lib/format";

export const metadata: Metadata = { title: "محصولات | پنل مدیریت" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const SORT_BY_VALUES: AdminProductSortBy[] = [
  "name",
  "category",
  "partsBrand",
  "wholesalePrice",
  "retailPrice",
  "stock",
  "isActive",
  "isOffer",
  "createdAt",
];

function pick(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function parseSortBy(value: string): AdminProductSortBy | undefined {
  return SORT_BY_VALUES.includes(value as AdminProductSortBy)
    ? (value as AdminProductSortBy)
    : undefined;
}

function parseSortDir(value: string): AdminProductSortDir | undefined {
  return value === "asc" || value === "desc" ? value : undefined;
}

export default function AdminProductsPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<ProductsSkeleton />}>
      <ProductsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ProductsContent({ searchParams }: Props) {
  const sp = await searchParams;
  const search = pick(sp.search);
  const categoryId = pick(sp.categoryId);
  const partsBrandId = pick(sp.partsBrandId);
  const carModelId = pick(sp.carModelId);
  const status = pick(sp.status);
  const offer = pick(sp.offer);
  const sortBy = pick(sp.sortBy);
  const sortDir = pick(sp.sortDir);
  const page = Number(pick(sp.page)) || 1;

  const filters = {
    search,
    categoryId,
    partsBrandId,
    carModelId,
    status,
    offer,
    sortBy,
    sortDir,
  };

  const [data, categories, partsBrands, carModels] = await Promise.all([
    getProductsAdmin({
      search: search || undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      partsBrandId: partsBrandId ? Number(partsBrandId) : undefined,
      carModelId: carModelId ? Number(carModelId) : undefined,
      isActive: status === "active" ? true : status === "inactive" ? false : undefined,
      isOffer: offer === "special" ? true : offer === "normal" ? false : undefined,
      sortBy: parseSortBy(sortBy),
      sortDir: parseSortDir(sortDir),
      page,
      perPage: 20,
    }),
    getCategories(),
    getPartsBrands(),
    getCarModelsAdmin(),
  ]);

  return (
    <div>
      <PageHeader
        title="محصولات و قیمت‌گذاری"
        description={`تعداد ${formatNumberFa(data.total)} محصول`}
        action={
          <Link href="/admin/products/new">
            <Button type="button">+ محصول جدید</Button>
          </Link>
        }
      />

      <ProductsTable
        items={data.items}
        total={data.total}
        filters={filters}
        categories={categories}
        partsBrands={partsBrands}
        carModels={carModels}
      />

      {data.pageCount > 1 && (
        <div className="flex items-center justify-center gap-1.5 flex-wrap pt-5">
          {Array.from({ length: data.pageCount }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={buildProductsHref(filters, p)}
              className={[
                "min-w-9 h-9 px-2 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors",
                p === data.page
                  ? "bg-accent text-charcoal"
                  : "bg-white border border-gray-200 text-charcoal hover:bg-silver-light",
              ].join(" ")}
            >
              {p.toLocaleString("fa-IR")}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
      <div className="h-96 bg-white rounded-2xl border border-gray-100 animate-pulse" />
    </div>
  );
}
