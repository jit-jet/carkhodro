export const TOROB_API_VERSION = 'torob_api_v3' as const;
export const TOROB_PAGE_SIZE = 100;

export type TorobSort = 'date_added_desc' | 'date_updated_desc';

export type TorobProductRequest =
  | { kind: 'urls'; pageUrls: string[] }
  | { kind: 'uniques'; pageUniques: string[] }
  | { kind: 'page'; page: number; sort: TorobSort };

export interface TorobProduct {
  page_unique: string;
  page_url: string;
  title: string;
  current_price: number;
  availability: boolean;
  image_links: string[];
  spec: Record<string, string | number>;
  old_price?: number;
  category_name?: string;
  short_desc?: string;
  date_added: string;
  date_updated: string;
}

export interface TorobProductResponse {
  api_version: typeof TOROB_API_VERSION;
  current_page: number;
  total: number;
  max_pages: number;
  products: TorobProduct[];
}

export type TorobParseResult =
  | { ok: true; request: TorobProductRequest }
  | { ok: false; error: string };
