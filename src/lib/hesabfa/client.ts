/**
 * Hesabfa API client.
 * ───────────────────
 * Thin, serverless-friendly wrapper over the Hesabfa REST API. Every call is a
 * stateless `fetch` POST with credentials in the body and `cache: 'no-store'`
 * (live financial data must never be cached at the network layer). No global
 * connection state, so it is safe to invoke from a cold lambda.
 *
 * All endpoints share the `{ Success, Result, ErrorCode, ErrorMessage }`
 * envelope; `post()` unwraps it and throws `HesabfaError` on a non-2xx HTTP
 * status or a `Success: false` body, so callers can deal in plain `Result`s.
 */

import type {
  HesabfaResponse,
  HesabfaItem,
  HesabfaItemList,
  HesabfaQueryInfo,
} from './types';

const DEFAULT_BASE_URL = 'https://api.hesabfa.com/v1';

/** How many items to pull per `getItems` page during a full sync. */
const PAGE_SIZE = 200;
/** Hard guard so a misbehaving `TotalCount` can never spin an infinite loop. */
const MAX_PAGES = 1000;

export class HesabfaError extends Error {
  constructor(
    message: string,
    readonly code?: number,
  ) {
    super(message);
    this.name = 'HesabfaError';
  }
}

interface HesabfaConfig {
  baseUrl: string;
  apiKey: string;
  loginToken: string;
}

/** Read + validate credentials from the environment (throws if misconfigured). */
function getConfig(): HesabfaConfig {
  const apiKey = process.env.HESABFA_API_KEY;
  const loginToken = process.env.HESABFA_LOGIN_TOKEN;
  if (!apiKey || !loginToken) {
    throw new HesabfaError(
      'Hesabfa is not configured — set HESABFA_API_KEY and HESABFA_LOGIN_TOKEN.',
    );
  }
  return {
    baseUrl: process.env.HESABFA_API_URL?.replace(/\/$/, '') ?? DEFAULT_BASE_URL,
    apiKey,
    loginToken,
  };
}

/** POST `body` (plus auth) to `path` and return the unwrapped `Result`. */
async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const { baseUrl, apiKey, loginToken } = getConfig();

  const res = await fetch(`${baseUrl}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, loginToken, ...body }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new HesabfaError(`Hesabfa HTTP ${res.status} on ${path}`);
  }

  const json = (await res.json()) as HesabfaResponse<T>;
  if (!json.Success) {
    throw new HesabfaError(
      json.ErrorMessage ?? `Hesabfa request to ${path} failed`,
      json.ErrorCode,
    );
  }
  return json.Result;
}

// ── Item reads ────────────────────────────────────────────────────────────────

/**
 * Resolve a batch of items by their Hesabfa numeric `Id` — the identifier the
 * change-hook delivers in `ObjectIdList`. Items that no longer exist (deleted)
 * are simply absent from the returned array.
 */
export async function getItemsById(ids: number[]): Promise<HesabfaItem[]> {
  if (ids.length === 0) return [];
  const result = await post<HesabfaItem[] | HesabfaItemList>('item/getById', {
    idList: ids,
  });
  return Array.isArray(result) ? result : (result.List ?? []);
}

/** Fetch one item by its accounting `Code`, or `null` if not found. */
export async function getItemByCode(code: string): Promise<HesabfaItem | null> {
  try {
    return await post<HesabfaItem>('item/get', { code });
  } catch (err) {
    if (err instanceof HesabfaError) return null;
    throw err;
  }
}

/**
 * Page through `item/getItems` and return every item in the account. Used by the
 * manual force-sync to rebuild the full picture and reconcile missed webhooks.
 */
export async function getAllItems(): Promise<HesabfaItem[]> {
  const all: HesabfaItem[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const queryInfo: HesabfaQueryInfo = {
      sortBy: 'Id',
      sortDesc: false,
      take: PAGE_SIZE,
      skip: page * PAGE_SIZE,
      filters: [],
    };
    const { List, TotalCount } = await post<HesabfaItemList>('item/getItems', {
      queryInfo,
    });

    all.push(...List);
    if (List.length === 0 || all.length >= TotalCount) break;
  }

  return all;
}

// ── Webhook registration ───────────────────────────────────────────────────────

/**
 * Register (or replace) the change-hook so Hesabfa POSTs create/update/delete
 * notifications to `url`. `hookPassword` is echoed back in every payload and is
 * how we authenticate inbound webhooks.
 */
export async function setChangeHook(
  url: string,
  hookPassword: string,
): Promise<void> {
  await post('setting/setChangeHook', { url, hookPassword });
}
