/**
 * Shared URL helpers for the admin products list — directive-free so both the
 * Server page (pagination links) and the Client table (header filters) can
 * build the same query string.
 */

export interface ProductsTableFilters {
  search: string;
  categoryId: string;
  partsBrandId: string;
  carModelId: string;
  status: string;
  offer: string;
  sortBy: string;
  sortDir: string;
}

export function buildProductsHref(filters: ProductsTableFilters, page?: number): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.partsBrandId) params.set("partsBrandId", filters.partsBrandId);
  if (filters.carModelId) params.set("carModelId", filters.carModelId);
  if (filters.status) params.set("status", filters.status);
  if (filters.offer) params.set("offer", filters.offer);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortDir) params.set("sortDir", filters.sortDir);
  if (page && page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/products?${qs}` : "/admin/products";
}
