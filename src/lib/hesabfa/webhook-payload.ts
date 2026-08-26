import type { HesabfaWebhookPayload } from './types';

const HESABFA_OBJECT_TYPES = new Set<HesabfaWebhookPayload['ObjectType']>([
  'Product',
  'Contact',
  'Invoice',
]);

/** Parse the exact change-hook JSON shape documented by Hesabfa. */
export function parseHesabfaWebhookPayload(value: unknown): HesabfaWebhookPayload | null {
  if (!value || typeof value !== 'object') return null;

  const payload = value as Record<string, unknown>;
  if (typeof payload.Password !== 'string') return null;
  if (
    typeof payload.ObjectType !== 'string' ||
    !HESABFA_OBJECT_TYPES.has(payload.ObjectType as HesabfaWebhookPayload['ObjectType'])
  ) {
    return null;
  }

  const action = Number(payload.Action);
  if (!Number.isInteger(action)) return null;
  if (!Array.isArray(payload.ObjectIdList)) return null;

  const ids = payload.ObjectIdList.map(Number);
  if (ids.some((id) => !Number.isSafeInteger(id) || id <= 0)) return null;

  return {
    Password: payload.Password,
    Action: action,
    ObjectType: payload.ObjectType as HesabfaWebhookPayload['ObjectType'],
    ObjectIdList: [...new Set(ids)],
  };
}
