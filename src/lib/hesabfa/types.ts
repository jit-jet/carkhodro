/**
 * Hesabfa API — shared types.
 * ───────────────────────────
 * Type definitions for the subset of the Hesabfa cloud-accounting REST API we
 * consume to keep the local catalogue in sync (price + stock) with the books.
 *
 * Docs: https://www.hesabfa.com/help/api
 *
 * Conventions:
 *   • Every endpoint is POST and authenticated by putting `apiKey` + `loginToken`
 *     in the JSON body (see `client.ts`).
 *   • Every response is wrapped in the same envelope: `{ Success, Result, … }`.
 *   • Hesabfa property names are PascalCase, so we model them as-is.
 */

/** The envelope every Hesabfa endpoint returns. `Result` is endpoint-specific. */
export interface HesabfaResponse<T> {
  Success: boolean;
  /** Present only on success. */
  Result: T;
  /** Numeric error code when `Success` is false (see Hesabfa error table). */
  ErrorCode?: number;
  ErrorMessage?: string;
}

/**
 * A Hesabfa inventory item ("کالا"). Only the fields we map are declared; the
 * API returns many more. `Id` is Hesabfa's internal numeric key (what webhooks
 * send in `ObjectIdList`); `Code` is the stable accounting code we store as the
 * product's `accountancyId` and reuse as the local SKU.
 */
export interface HesabfaItem {
  Id: number;
  /** Accounting code — unique, human-facing. May come back as number or string. */
  Code: number | string;
  Name: string;
  Barcode?: string | null;
  /** On-hand inventory quantity. */
  Stock?: number | null;
  /** Sale (retail) price in the account's currency unit. */
  SellPrice?: number | null;
  /** Purchase price — not surfaced to the storefront, kept for completeness. */
  BuyPrice?: number | null;
  /** 0 = product/good, others = service etc. */
  ItemType?: number | null;
}

/** `Result` shape of `item/getItems` (paged list). */
export interface HesabfaItemList {
  List: HesabfaItem[];
  TotalCount: number;
  FilteredCount: number;
}

/** Paging/sort/filter envelope accepted by `item/getItems`. */
export interface HesabfaQueryInfo {
  sortBy?: string;
  sortDesc?: boolean;
  take?: number;
  skip?: number;
  filters?: unknown[];
}

/**
 * The JSON body Hesabfa POSTs to our webhook on any create/update/delete of a
 * watched object. We only act on `ObjectType === 'Product'`. `ObjectIdList`
 * holds Hesabfa `Id`s (not `Code`s). `Password` echoes the `hookPassword` we
 * registered and is the only authenticity check Hesabfa offers.
 */
export interface HesabfaWebhookPayload {
  Password: string;
  /** Integer action code (insert/edit/delete) — we refetch instead of trusting it. */
  Action: number;
  ObjectType: 'Product' | 'Invoice' | 'Contact' | string;
  ObjectIdList: number[];
}
