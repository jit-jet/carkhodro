import type { ProductVM } from '@/src/lib/serializers';

export const PRODUCT_PAGE_SIZE = 12;

export type ProductBrowseSort =
  | 'relevance'
  | 'newest'
  | 'oldest'
  | 'best_selling'
  | 'most_viewed'
  | 'alpha_asc'
  | 'alpha_desc';

export interface ProductBrowseInput {
  page: number;
  query: string;
  brands: string[];
  carBrands: string[];
  carTypes: string[];
  categories: string[];
  offerOnly: boolean;
  sort: ProductBrowseSort;
}

export interface ProductBrowsePage {
  items: ProductVM[];
  total: number;
  nextPage: number;
  hasMore: boolean;
  failed?: boolean;
}

type SearchParamRecord = Record<string, string | string[] | undefined>;

const SORTS = new Set<ProductBrowseSort>([
  'relevance',
  'newest',
  'oldest',
  'best_selling',
  'most_viewed',
  'alpha_asc',
  'alpha_desc',
]);

function values(params: SearchParamRecord, key: string): string[] {
  const value = params[key];
  if (Array.isArray(value)) return value.filter(Boolean);
  return typeof value === 'string' && value ? [value] : [];
}

export function resolveProductBrowseSort(
  value: string | null | undefined,
  isSearching: boolean,
): ProductBrowseSort {
  if (value === 'relevance') return isSearching ? 'relevance' : 'newest';
  if (value && SORTS.has(value as ProductBrowseSort)) return value as ProductBrowseSort;
  return isSearching ? 'relevance' : 'newest';
}

export function productBrowseInputFromParams(
  params: SearchParamRecord,
  page = 1,
): ProductBrowseInput {
  const query = typeof params.q === 'string' ? params.q.trim() : '';
  return {
    page: Math.max(1, Math.trunc(page)),
    query,
    brands: values(params, 'brand'),
    carBrands: values(params, 'carBrand'),
    carTypes: values(params, 'car'),
    categories: values(params, 'category'),
    offerOnly: params.offer === '1',
    sort: resolveProductBrowseSort(
      typeof params.sort === 'string' ? params.sort : null,
      query.length > 0,
    ),
  };
}

export function productBrowseKey(input: ProductBrowseInput): string {
  return JSON.stringify({ ...input, page: 1 });
}

export function filterAndSortProductVMs(
  products: ProductVM[],
  input: ProductBrowseInput,
): ProductVM[] {
  let result = products;
  if (input.brands.length) {
    result = result.filter((product) => input.brands.includes(product.brandSlug));
  }
  if (input.carBrands.length) {
    result = result.filter((product) =>
      input.carBrands.some((slug) => product.carBrandSlugs.includes(slug)),
    );
  }
  if (input.carTypes.length) {
    result = result.filter((product) =>
      input.carTypes.some((name) => product.carTypes.includes(name)),
    );
  }
  if (input.categories.length) {
    result = result.filter((product) => input.categories.includes(product.category));
  }
  if (input.offerOnly) result = result.filter((product) => product.isOffer);

  if (input.sort === 'relevance') return result;

  const stockFirst = (a: ProductVM, b: ProductVM) =>
    (b.stock > 0 ? 1 : 0) - (a.stock > 0 ? 1 : 0);
  const sorted = [...result];
  switch (input.sort) {
    case 'newest':
      return sorted.sort((a, b) => stockFirst(a, b) || b.createdDate.localeCompare(a.createdDate));
    case 'oldest':
      return sorted.sort((a, b) => stockFirst(a, b) || a.createdDate.localeCompare(b.createdDate));
    case 'best_selling':
      return sorted.sort((a, b) => stockFirst(a, b) || b.salesCount - a.salesCount);
    case 'most_viewed':
      return sorted.sort((a, b) => stockFirst(a, b) || b.viewCount - a.viewCount);
    case 'alpha_asc':
      return sorted.sort((a, b) => stockFirst(a, b) || a.name.localeCompare(b.name, 'fa'));
    case 'alpha_desc':
      return sorted.sort((a, b) => stockFirst(a, b) || b.name.localeCompare(a.name, 'fa'));
  }
}
