/**
 * Central registry of cache tags used with `use cache` / `cacheTag` (reads)
 * and `updateTag` / `revalidateTag` (mutations). Keeping them in one place
 * prevents typos and makes invalidation relationships easy to audit.
 */

export const tags = {
  products: 'products',
  product: (id: string) => `product:${id}`,
  categories: 'categories',
  carBrands: 'car-brands',
  carModels: 'car-models',
  partsBrands: 'parts-brands',
  provinces: 'provinces',
  navLinks: 'nav-links',
  shipping: 'shipping-options',
  reviews: (productId: string) => `reviews:${productId}`,
  faqs: 'faqs',
  posts: 'posts',
  post: (slug: string) => `post:${slug}`,
  siteSettings: 'site-settings',
  socialLinks: 'social-links',
} as const;
