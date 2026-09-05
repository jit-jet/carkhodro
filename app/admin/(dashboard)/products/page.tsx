import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getProductsAdmin, type AdminProductSortBy, type AdminProductSortDir } from "@/actions/products";
import { getCategoriesAdmin } from "@/actions/categories";
import { getPartsBrandsAdmin, getCarModelsAdmin } from "@/actions/brands";
import { PageHeader, Button } from "@/src/components/admin/AdminUI";
import AdminPagination from "@/src/components/admin/AdminPagination";
import ProductsTable from "@/src/components/admin/ProductsTable";
import { parsePage, parsePerPage, pickSearchParam } from "@/src/lib/admin-pagination";
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
  const search = pickSearchParam(sp.search);
  const categoryId = pickSearchParam(sp.categoryId);
  const partsBrandId = pickSearchParam(sp.partsBrandId);
  const carModelId = pickSearchParam(sp.carModelId);
  const status = pickSearchParam(sp.status);
  const offer = pickSearchParam(sp.offer);
  const stock = pickSearchParam(sp.stock);
  const callForPrice = pickSearchParam(sp.callForPrice);
  const sortBy = pickSearchParam(sp.sortBy);
  const sortDir = pickSearchParam(sp.sortDir);
  const page = parsePage(sp.page);
  const perPage = parsePerPage(sp.perPage);

  const callForPriceFilter =
    callForPrice === "retail" ||
    callForPrice === "wholesale" ||
    callForPrice === "none" ||
    callForPrice === "any"
      ? callForPrice
      : undefined;

  const filters = {
    search,
    categoryId,
    partsBrandId,
    carModelId,
    status,
    offer,
    stock,
    callForPrice,
    sortBy,
    sortDir,
    perPage,
  };

  const [data, categories, partsBrands, carModels] = await Promise.all([
    getProductsAdmin({
      search: search || undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      partsBrandId: partsBrandId ? Number(partsBrandId) : undefined,
      carModelId: carModelId ? Number(carModelId) : undefined,
      isActive: status === "active" ? true : status === "inactive" ? false : undefined,
      isOffer: offer === "special" ? true : offer === "normal" ? false : undefined,
      stock:
        stock === "in_stock" || stock === "out_of_stock" ? stock : undefined,
      callForPrice: callForPriceFilter,
      sortBy: parseSortBy(sortBy),
      sortDir: parseSortDir(sortDir),
      page,
      perPage,
    }),
    getCategoriesAdmin(),
    getPartsBrandsAdmin(),
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

      <AdminPagination
        page={data.page}
        pageCount={data.pageCount}
        total={data.total}
        perPage={data.perPage}
        pathname="/admin/products"
        query={{
          ...(search ? { search } : {}),
          ...(categoryId ? { categoryId } : {}),
          ...(partsBrandId ? { partsBrandId } : {}),
          ...(carModelId ? { carModelId } : {}),
          ...(status ? { status } : {}),
          ...(offer ? { offer } : {}),
          ...(stock ? { stock } : {}),
          ...(callForPrice ? { callForPrice } : {}),
          ...(sortBy ? { sortBy } : {}),
          ...(sortDir ? { sortDir } : {}),
        }}
      />
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
