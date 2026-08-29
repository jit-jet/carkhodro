/**
 * Hesabfa REST client — stateless POSTs with credentials in the body.
 * Docs: https://www.hesabfa.com/help/api
 */

import { randomUUID } from 'node:crypto';
import { getSystemConfig } from '@/src/lib/system-settings';
import type {
  HesabfaContact,
  HesabfaInvoice,
  HesabfaItem,
  HesabfaItemQuantity,
  HesabfaPagedList,
  HesabfaProductCategoryNode,
  HesabfaProductCategoryTree,
  HesabfaQueryInfo,
  HesabfaResponse,
} from './types';
import { extractTopLevelCategories, isHesabfaRootCategoryName } from './category-path';

const DEFAULT_BASE_URL = 'https://api.hesabfa.com/v1';
const PAGE_SIZE = 200;
const MAX_PAGES = 1000;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 400;

export class HesabfaError extends Error {
  constructor(
    message: string,
    readonly code?: number,
  ) {
    super(message);
    this.name = 'HesabfaError';
  }
}

/** Human-readable labels for Hesabfa ErrorCode values (api/errorcode). */
const HESABFA_ERROR_LABELS: Record<number, string> = {
  100: 'InternalServerError',
  101: 'TooManyRequests',
  103: 'MissingData',
  104: 'MissingParameter',
  105: 'ApiDisabled',
  106: 'UserIsNotOwner',
  107: 'BusinessNotFound',
  108: 'BusinessExpired',
  109: 'FinanYearNotFound',
  110: 'IdMustBeZero',
  111: 'IdMustNotBeZero',
  112: 'ObjectNotFound',
  113: 'MissingApiKey',
  114: 'ParameterIsOutOfRange',
  120: 'DuplicateRequestId',
  190: 'ApplicationError',
};

function formatHesabfaFailure(
  path: string,
  errorCode?: number,
  errorMessage?: string,
): string {
  const label =
    errorCode != null ? (HESABFA_ERROR_LABELS[errorCode] ?? 'Unknown') : 'Unknown';
  const codePart = errorCode != null ? `ErrorCode ${errorCode} (${label})` : 'unknown ErrorCode';
  const msg = errorMessage?.trim();
  return msg
    ? `Hesabfa ${path}: ${codePart} — ${msg}`
    : `Hesabfa ${path}: ${codePart}`;
}

interface HesabfaConfig {
  baseUrl: string;
  apiKey: string;
  loginToken: string;
}

export async function isHesabfaConfigured(): Promise<boolean> {
  const config = await getSystemConfig();
  return Boolean(config.hesabfaApiKey && config.hesabfaLoginToken);
}

async function getConfig(): Promise<HesabfaConfig> {
  const settings = await getSystemConfig();
  const apiKey = settings.hesabfaApiKey;
  const loginToken = settings.hesabfaLoginToken;
  if (!apiKey || !loginToken) {
    throw new HesabfaError(
      'Hesabfa is not configured in System Settings.',
    );
  }
  return {
    baseUrl: settings.hesabfaApiUrl.replace(/\/$/, '') || DEFAULT_BASE_URL,
    apiKey,
    loginToken,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function post<T>(
  path: string,
  body: Record<string, unknown>,
  opts?: { unique?: boolean },
): Promise<T> {
  const { baseUrl, apiKey, loginToken } = await getConfig();
  const payload: Record<string, unknown> = {
    apiKey,
    loginToken,
    ...body,
  };
  if (opts?.unique) {
    payload.requestUniqueId = randomUUID();
  }
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${baseUrl}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      });

      if (res.status === 429 || res.status >= 500) {
        throw new HesabfaError(`Hesabfa HTTP ${res.status} on ${path}`);
      }
      if (!res.ok) {
        throw new HesabfaError(`Hesabfa HTTP ${res.status} on ${path}`);
      }

      const json = (await res.json()) as HesabfaResponse<T>;
      if (!json.Success) {
        throw new HesabfaError(
          formatHesabfaFailure(path, json.ErrorCode, json.ErrorMessage),
          json.ErrorCode,
        );
      }
      return json.Result;
    } catch (err) {
      lastError = err;
      const retryable =
        err instanceof HesabfaError &&
        (err.message.includes('HTTP 429') ||
          err.message.includes('HTTP 5') ||
          err.message.includes('fetch'));
      if (!retryable || attempt === MAX_RETRIES - 1) break;
      await sleep(RETRY_BASE_MS * 2 ** attempt);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new HesabfaError(`Hesabfa request to ${path} failed`);
}

async function getAllPages<T>(
  path: string,
  extra: Record<string, unknown> = {},
  sortBy = 'Code',
  filters: HesabfaQueryInfo['filters'] = [],
): Promise<T[]> {
  const all: T[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const queryInfo: HesabfaQueryInfo = {
      sortBy,
      sortDesc: false,
      take: PAGE_SIZE,
      skip: page * PAGE_SIZE,
      filters,
    };
    const result = await post<HesabfaPagedList<T>>(path, { ...extra, queryInfo });
    const list = result.List ?? [];
    all.push(...list);
    if (list.length === 0 || all.length >= (result.TotalCount ?? 0)) break;
  }
  return all;
}

function asList<T>(result: T | T[] | HesabfaPagedList<T> | null | undefined): T[] {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (typeof result === 'object' && 'List' in result) return result.List ?? [];
  return [result];
}

// ── Items ─────────────────────────────────────────────────────────────────────

export async function getItemByCode(code: string): Promise<HesabfaItem | null> {
  try {
    return await post<HesabfaItem>('item/get', { code });
  } catch (err) {
    if (err instanceof HesabfaError) return null;
    throw err;
  }
}

export async function getItemsById(ids: number[]): Promise<HesabfaItem[]> {
  if (ids.length === 0) return [];
  const result = await post<HesabfaItem | HesabfaItem[] | HesabfaPagedList<HesabfaItem>>(
    'item/getById',
    { idList: ids },
  );
  return asList(result);
}

export async function getAllItems(): Promise<HesabfaItem[]> {
  return getAllPages<HesabfaItem>('item/getItems');
}

export async function saveItem(
  item: Record<string, unknown>,
): Promise<HesabfaItem> {
  return post<HesabfaItem>('item/save', { item }, { unique: true });
}

export async function saveItems(
  items: Record<string, unknown>[],
): Promise<HesabfaItem[]> {
  if (items.length === 0) return [];
  if (items.length === 1) return [await saveItem(items[0]!)];
  const result = await post<HesabfaItem | HesabfaItem[]>('item/batchSave', { items }, {
    unique: true,
  });
  return asList(result);
}

/** Read stock for selected codes, or every item when `codes` is omitted. */
export async function getItemQuantities(codes?: string[]): Promise<HesabfaItemQuantity[]> {
  const result = await post<HesabfaItemQuantity | HesabfaItemQuantity[]>(
    'item/GetQuantity',
    codes ? { codes } : {},
  );
  return asList(result);
}

export async function deleteItem(code: string): Promise<void> {
  await post<unknown>('item/delete', { code }, { unique: true });
}

/**
 * Top-level product categories from Hesabfa (`setting/getProductCategories`).
 * Skips «کالا» / «کالاها» and returns only their direct children
 * (e.g. «موتوری», not nested «یاتاقان»).
 */
export async function getProductCategories(): Promise<HesabfaProductCategoryNode[]> {
  const result = await post<
    HesabfaProductCategoryTree | HesabfaProductCategoryNode[] | HesabfaPagedList<HesabfaProductCategoryNode>
  >('setting/getProductCategories', {});

  if (Array.isArray(result)) {
    return result.filter((n) => {
      const name = n.Name?.trim();
      return Boolean(name) && !isHesabfaRootCategoryName(name);
    });
  }
  if (result && typeof result === 'object' && 'List' in result && Array.isArray(result.List)) {
    return result.List.filter((n) => {
      const name = n.Name?.trim();
      return Boolean(name) && !isHesabfaRootCategoryName(name);
    });
  }
  if (result && typeof result === 'object' && 'Root' in result) {
    return extractTopLevelCategories(result.Root);
  }
  return [];
}

// ── Contacts ──────────────────────────────────────────────────────────────────

export async function getContactByCode(code: string): Promise<HesabfaContact | null> {
  try {
    return await post<HesabfaContact>('contact/get', { code });
  } catch (err) {
    if (err instanceof HesabfaError) return null;
    throw err;
  }
}

export async function getContactsById(ids: number[]): Promise<HesabfaContact[]> {
  if (ids.length === 0) return [];
  const result = await post<
    HesabfaContact | HesabfaContact[] | HesabfaPagedList<HesabfaContact>
  >(
    'contact/getById',
    { idList: ids },
  );
  return asList(result);
}

export async function getAllContacts(): Promise<HesabfaContact[]> {
  return getAllPages<HesabfaContact>('contact/getContacts');
}

export async function getContactsByMobiles(mobiles: string[]): Promise<HesabfaContact[]> {
  const values = [...new Set(mobiles.map((mobile) => mobile.trim()).filter(Boolean))];
  if (values.length === 0) return [];
  return getAllPages<HesabfaContact>('contact/getContacts', {}, 'Code', [
    { property: 'Mobile', operator: 'in', value: values },
  ]);
}

export async function saveContact(
  contact: Record<string, unknown>,
): Promise<HesabfaContact> {
  return post<HesabfaContact>('contact/save', { contact }, { unique: true });
}


// ── Invoices ──────────────────────────────────────────────────────────────────

export async function getInvoiceByNumber(
  number: string | number,
  type = 0,
): Promise<HesabfaInvoice | null> {
  try {
    return await post<HesabfaInvoice>('invoice/get', { number, type });
  } catch (err) {
    if (err instanceof HesabfaError) return null;
    throw err;
  }
}

export async function getInvoicesById(ids: number[]): Promise<HesabfaInvoice[]> {
  if (ids.length === 0) return [];
  const result = await post<
    HesabfaInvoice | HesabfaInvoice[] | HesabfaPagedList<HesabfaInvoice>
  >('invoice/getById', { idList: ids });
  return asList(result);
}

export async function saveInvoice(
  invoice: Record<string, unknown>,
): Promise<HesabfaInvoice> {
  return post<HesabfaInvoice>('invoice/save', { invoice }, { unique: true });
}

export async function saveInvoicePayment(body: Record<string, unknown>): Promise<unknown> {
  return post('invoice/savePayment', body, { unique: true });
}

export async function changeInvoicePaidStatus(
  number: string | number,
  paid: boolean,
  type = 0,
): Promise<HesabfaInvoice> {
  return post<HesabfaInvoice>(
    'invoice/changePaidStatus',
    { number, type, paid },
    { unique: true },
  );
}

export async function changeInvoiceSentStatus(
  number: string | number,
  sent: boolean,
  type = 0,
): Promise<HesabfaInvoice> {
  return post<HesabfaInvoice>(
    'invoice/changeSentStatus',
    { number, type, sent },
    { unique: true },
  );
}

// ── Webhook registration ──────────────────────────────────────────────────────

export async function setChangeHook(url: string, hookPassword: string): Promise<void> {
  await post('setting/setChangeHook', { url, hookPassword }, { unique: true });
}

export async function getChangeHook(): Promise<{ url?: string; password?: string } | null> {
  try {
    return await post<{ url?: string; password?: string }>('setting/getChangeHook', {});
  } catch (err) {
    if (err instanceof HesabfaError) return null;
    throw err;
  }
}
