/**
 * Price-list request — «دریافت لیست قیمت».
 * Build a filtered price list (titles + brand + car-model checkboxes) and
 * generate a printable PDF valid ~24h. Brands/cars come from the catalogue.
 */

import type { Metadata } from 'next';
import { getPartsBrands } from '@/actions/brands';
import { getCarModels } from '@/actions/brands';
import PriceListForm from '@/src/components/dashboard/PriceListForm';

export const metadata: Metadata = {
  title: 'دریافت لیست قیمت | پنل کاربری کارخودرو',
};

export default async function PriceListPage() {
  const [brands, cars] = await Promise.all([getPartsBrands(), getCarModels()]);
  return (
    <PriceListForm
      brands={brands}
      cars={cars.map((c) => ({ id: c.id, name: c.name, brandName: c.brandName }))}
    />
  );
}
