/**
 * Hesabfa API types (PascalCase fields match the API).
 * Docs: https://www.hesabfa.com/help/api
 */

export interface HesabfaResponse<T> {
  Success: boolean;
  Result: T;
  ErrorCode?: number;
  ErrorMessage?: string;
}

export interface HesabfaQueryInfo {
  sortBy?: string;
  sortDesc?: boolean;
  take?: number;
  skip?: number;
  filters?: Array<{
    property: string;
    operator: string;
    value: string | number | boolean | Array<string | number | boolean>;
  }>;
}

export interface HesabfaPagedList<T> {
  List: T[];
  TotalCount: number;
  FilteredCount?: number;
  From?: number;
  To?: number;
}

export interface HesabfaPriceListEntry {
  Title?: string;
  title?: string;
  Currency?: string;
  currency?: string;
  Price?: number;
  price?: number;
}

export interface HesabfaItem {
  Id?: number;
  Code: number | string;
  Name: string;
  Barcode?: string | null;
  ItemType?: number | null;
  Unit?: string | null;
  /** Inventory from item/get* (`Stock` field). */
  Stock?: number | null;
  BuyPrice?: number | null;
  SellPrice?: number | null;
  NodeFamily?: string | null;
  Tag?: string | null;
  Description?: string | null;
  ProductCode?: string | null;
  Active?: boolean | null;
  PriceList?: HesabfaPriceListEntry[] | null;
}

/** Row returned by `item/GetQuantity`. */
export interface HesabfaItemQuantity {
  Code: number | string;
  Quantity?: number | null;
}

export interface HesabfaContact {
  Id?: number;
  Code: number | string;
  Name: string;
  Company?: string | null;
  FirstName?: string | null;
  LastName?: string | null;
  ContactType?: number | null;
  NationalCode?: string | null;
  Address?: string | null;
  City?: string | null;
  State?: string | null;
  PostalCode?: string | null;
  Phone?: string | null;
  Mobile?: string | null;
  Email?: string | null;
  Note?: string | null;
  Tag?: string | null;
  Active?: boolean | null;
  NodeFamily?: string | null;
}

export interface HesabfaInvoiceItem {
  Id?: number;
  RowNumber?: number;
  Description?: string;
  ItemCode?: string | null;
  /** Some invoice responses put the code only on the nested Item object. */
  Item?: Pick<HesabfaItem, 'Code'> | null;
  Unit?: string | null;
  Quantity?: number;
  UnitPrice?: number;
  Discount?: number;
  Tax?: number;
  TotalAmount?: number;
}

export interface HesabfaInvoice {
  Id?: number;
  Number: number | string;
  Reference?: string | null;
  Date?: string;
  DueDate?: string;
  ContactCode?: string | null;
  ContactTitle?: string | null;
  Sum?: number;
  Payable?: number;
  Paid?: number;
  Rest?: number;
  Note?: string | null;
  Sent?: boolean;
  Returned?: boolean;
  InvoiceType?: number;
  Status?: number;
  Tag?: string | null;
  Freight?: number;
  Currency?: string | null;
  InvoiceItems?: HesabfaInvoiceItem[];
}

/** Node in the `setting/getProductCategories` tree (not a flat list). */
export interface HesabfaProductCategoryNode {
  Name?: string;
  FullPath?: string;
  Children?: HesabfaProductCategoryNode[] | null;
}

export interface HesabfaProductCategoryTree {
  Root?: HesabfaProductCategoryNode | null;
}

/** @deprecated Use HesabfaProductCategoryNode — kept for call-site compatibility. */
export type HesabfaProductCategory = HesabfaProductCategoryNode;

/** Payload Hesabfa POSTs to the change-hook URL. */
export interface HesabfaWebhookPayload {
  Password: string;
  Action: number;
  ObjectType: 'Product' | 'Invoice' | 'Contact';
  ObjectIdList: number[];
}

/** Hesabfa change-hook action codes from the official TypesTable documentation. */
export const HESABFA_ACTION = {
  CONTACT_SAVE: 31,
  CONTACT_EDIT: 32,
  CONTACT_DELETE: 33,
  PRODUCT_SAVE: 51,
  PRODUCT_EDIT: 52,
  PRODUCT_DELETE: 53,
  PRODUCT_IMPORT: 101,
  CONTACT_IMPORT: 102,
  SALES_INVOICE_SAVE: 121,
  SALES_INVOICE_EDIT: 122,
  SALES_INVOICE_DELETE: 123,
  PURCHASE_INVOICE_SAVE: 131,
  PURCHASE_INVOICE_EDIT: 132,
  PURCHASE_INVOICE_DELETE: 133,
  SALES_RETURN_SAVE: 141,
  SALES_RETURN_EDIT: 142,
  SALES_RETURN_DELETE: 143,
  PURCHASE_RETURN_SAVE: 151,
  PURCHASE_RETURN_EDIT: 152,
  PURCHASE_RETURN_DELETE: 153,
  WASTE_INVOICE_SAVE: 161,
  WASTE_INVOICE_EDIT: 162,
  WASTE_INVOICE_DELETE: 163,
  RECEIVE_RECEIPT_SAVE: 181,
  RECEIVE_RECEIPT_EDIT: 182,
  RECEIVE_RECEIPT_DELETE: 183,
  PAYMENT_RECEIPT_SAVE: 191,
  PAYMENT_RECEIPT_EDIT: 192,
  PAYMENT_RECEIPT_DELETE: 193,
  WAREHOUSE_RECEIPT_SAVE: 261,
  WAREHOUSE_RECEIPT_EDIT: 262,
  WAREHOUSE_RECEIPT_DELETE: 263,
  ONLINE_INVOICE_PAYMENT_SAVE: 500,
  ONLINE_CONTACT_DEPOSIT_SAVE: 501,
} as const;

export const HESABFA_INVOICE_TYPE_SALE = 0;
export const HESABFA_CONTACT_TYPE_CUSTOMER = 2;
export const HESABFA_ITEM_TYPE_PRODUCT = 0;
export const HESABFA_CONTACT_NODE_FAMILY = 'اشخاص : مشتریان فروشگاه آنلاین';
export const HESABFA_INVOICE_NOTE = 'فاکتور صادر شده توسط وب سایت کار خودرو';
export const HESABFA_TAG = 'carkhodro';
