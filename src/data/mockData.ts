// Re-exports from the normalized mock database. See mockDatabase.ts for the source of truth.
export type { Product, NavLink, Category } from './mockDatabase';
export {
  categories,
  navLinks,
  newProducts,
  offerProducts,
} from './mockDatabase';

// ── Backward-compat shapes for CarModelsSlider & BrandsSlider ────────────────
// These components reference `.brandId` and `.brandName` on car models,
// and `.image` / `.count` on brands — we map to the normalized fields here.

import { carBrands, carModels as rawCarModels } from './mockDatabase';
import type { CarBrand, CarModel as CarModelRow } from './mockDatabase';

export type SpareBrand = { id: number; name: string; image: string; count: number };
export type CarModel   = CarModelRow & { brandId: number; brandName: string };

export const spareBrands: SpareBrand[] = carBrands.map(b => ({
  id:    b.id,
  name:  b.name,
  image: b.logoImage,
  count: b.productCount,
}));

export const carModels: CarModel[] = rawCarModels.map(m => ({
  ...m,
  brandId:   m.carBrandId,
  brandName: carBrands.find(b => b.id === m.carBrandId)!.name,
}));

export type { CarBrand };
