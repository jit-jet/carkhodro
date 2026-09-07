import type { TorobParseResult, TorobSort } from '@/src/lib/torob/types';

const SORTS = new Set<TorobSort>(['date_added_desc', 'date_updated_desc']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmptyStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === 'string' && item.trim().length > 0)
  );
}

function onlyKeys(body: Record<string, unknown>, allowed: readonly string[]): boolean {
  const allowedKeys = new Set(allowed);
  return Object.keys(body).every((key) => allowedKeys.has(key));
}

function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return value === value.trim() && (url.protocol === 'http:' || url.protocol === 'https:');
  } catch {
    return false;
  }
}

export function parseTorobProductRequest(body: unknown): TorobParseResult {
  if (!isRecord(body)) {
    return { ok: false, error: 'request body must be a JSON object' };
  }

  const suppliedModes = ['page_urls', 'page_uniques', 'page'].filter(
    (key) => body[key] !== undefined,
  );
  if (suppliedModes.length !== 1) {
    return {
      ok: false,
      error: 'provide exactly one of page_urls, page_uniques, or page',
    };
  }

  if (body.page_urls !== undefined) {
    if (!nonEmptyStringArray(body.page_urls)) {
      return { ok: false, error: 'page_urls must be a non-empty list of strings' };
    }
    if (!body.page_urls.every((url) => url.length <= 1500 && isAbsoluteHttpUrl(url))) {
      return { ok: false, error: 'page_urls must contain absolute HTTP(S) URLs' };
    }
    if (!onlyKeys(body, ['page_urls'])) {
      return { ok: false, error: 'page_urls cannot be combined with other parameters' };
    }
    return { ok: true, request: { kind: 'urls', pageUrls: body.page_urls } };
  }

  if (body.page_uniques !== undefined) {
    if (!nonEmptyStringArray(body.page_uniques)) {
      return { ok: false, error: 'page_uniques must be a non-empty list of strings' };
    }
    if (!body.page_uniques.every((unique) => unique.length <= 200)) {
      return { ok: false, error: 'page_uniques items must not exceed 200 characters' };
    }
    if (!onlyKeys(body, ['page_uniques'])) {
      return { ok: false, error: 'page_uniques cannot be combined with other parameters' };
    }
    return { ok: true, request: { kind: 'uniques', pageUniques: body.page_uniques } };
  }

  if (!Number.isInteger(body.page) || (body.page as number) < 1) {
    return { ok: false, error: 'page must be an integer starting from 1' };
  }
  if (typeof body.sort !== 'string') {
    return { ok: false, error: 'sort parameter is not provided' };
  }
  if (!SORTS.has(body.sort as TorobSort)) {
    return {
      ok: false,
      error: 'sort must be date_added_desc or date_updated_desc',
    };
  }
  if (!onlyKeys(body, ['page', 'sort'])) {
    return { ok: false, error: 'paginated requests only accept page and sort' };
  }

  return {
    ok: true,
    request: { kind: 'page', page: body.page as number, sort: body.sort as TorobSort },
  };
}
