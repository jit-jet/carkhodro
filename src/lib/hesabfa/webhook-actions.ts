import { HESABFA_ACTION } from './types';

export type HesabfaWebhookActionKind = 'upsert' | 'delete' | 'ignore';

const PRODUCT_UPSERT_ACTIONS = new Set<number>([
  HESABFA_ACTION.PRODUCT_SAVE,
  HESABFA_ACTION.PRODUCT_EDIT,
  HESABFA_ACTION.PRODUCT_IMPORT,
]);

const CONTACT_UPSERT_ACTIONS = new Set<number>([
  HESABFA_ACTION.CONTACT_SAVE,
  HESABFA_ACTION.CONTACT_EDIT,
  HESABFA_ACTION.CONTACT_IMPORT,
]);

const INVOICE_UPSERT_ACTIONS = new Set<number>([
  HESABFA_ACTION.SALES_INVOICE_SAVE,
  HESABFA_ACTION.SALES_INVOICE_EDIT,
  HESABFA_ACTION.PURCHASE_INVOICE_SAVE,
  HESABFA_ACTION.PURCHASE_INVOICE_EDIT,
  HESABFA_ACTION.SALES_RETURN_SAVE,
  HESABFA_ACTION.SALES_RETURN_EDIT,
  HESABFA_ACTION.PURCHASE_RETURN_SAVE,
  HESABFA_ACTION.PURCHASE_RETURN_EDIT,
  HESABFA_ACTION.WASTE_INVOICE_SAVE,
  HESABFA_ACTION.WASTE_INVOICE_EDIT,
]);

const INVOICE_DELETE_ACTIONS = new Set<number>([
  HESABFA_ACTION.SALES_INVOICE_DELETE,
  HESABFA_ACTION.PURCHASE_INVOICE_DELETE,
  HESABFA_ACTION.SALES_RETURN_DELETE,
  HESABFA_ACTION.PURCHASE_RETURN_DELETE,
  HESABFA_ACTION.WASTE_INVOICE_DELETE,
]);

/** Classify only documented ObjectType/action combinations. */
export function classifyHesabfaWebhookAction(
  objectType: string,
  action: number,
): HesabfaWebhookActionKind {
  if (objectType === 'Product') {
    if (action === HESABFA_ACTION.PRODUCT_DELETE) return 'delete';
    return PRODUCT_UPSERT_ACTIONS.has(action) ? 'upsert' : 'ignore';
  }

  if (objectType === 'Contact') {
    if (action === HESABFA_ACTION.CONTACT_DELETE) return 'delete';
    return CONTACT_UPSERT_ACTIONS.has(action) ? 'upsert' : 'ignore';
  }

  if (objectType === 'Invoice') {
    if (INVOICE_DELETE_ACTIONS.has(action)) return 'delete';
    return INVOICE_UPSERT_ACTIONS.has(action) ? 'upsert' : 'ignore';
  }

  return 'ignore';
}
