// Re-exports from the normalized mock database. See mockDatabase.ts for the source of truth.
export type { Product, PLPProduct } from './mockDatabase';
export {
  products as plpProducts,
  PLP_BRANDS,
  PLP_CAR_TYPES,
  PLP_CATEGORIES,
} from './mockDatabase';
