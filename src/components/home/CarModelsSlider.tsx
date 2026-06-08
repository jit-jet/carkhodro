"use client";

import { useState } from "react";
import Image from "next/image";
import SliderWrapper from "@/src/components/ui/SliderWrapper";
import SectionTitle from "@/src/components/ui/SectionTitle";
import type { CarBrandVM, CarModelVM } from "@/src/lib/serializers";

export default function CarModelsSlider({
  spareBrands,
  carModels,
}: {
  spareBrands: CarBrandVM[];
  carModels: CarModelVM[];
}) {
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);

  const filteredModels = selectedBrandId
    ? carModels.filter((m) => m.brandId === selectedBrandId)
    : carModels;

  return (
    <section className="py-10 bg-silver-light">
      <div className="max-w-7xl mx-auto px-4">
        <SectionTitle
          title="جستجو بر اساس مدل خودرو"
          subtitle="خودرو خود را انتخاب کنید و قطعات مرتبط را بیابید"
          linkHref="/products"
          linkLabel="همه مدل‌ها"
        />

        {/* Brand filter pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 mb-5">
          <button
            onClick={() => setSelectedBrandId(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-colors ${
              selectedBrandId === null
                ? "bg-accent border-accent text-charcoal"
                : "bg-white border-silver text-charcoal hover:border-accent"
            }`}
          >
            همه
          </button>
          {spareBrands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => setSelectedBrandId(brand.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-colors ${
                selectedBrandId === brand.id
                  ? "bg-accent border-accent text-charcoal"
                  : "bg-white border-silver text-charcoal hover:border-accent"
              }`}
            >
              {brand.name}
            </button>
          ))}
        </div>

        {/* Models slider */}
        <SliderWrapper>
          {filteredModels.map((model) => (
            <a
              key={model.id}
              href={`/products?car=${encodeURIComponent(model.name)}`}
              className="flex-shrink-0 w-44 sm:w-48 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md border border-gray-100 hover:border-accent transition-all duration-200 group"
            >
              {/* Car visual */}
              <div className="relative w-full h-24 rounded-xl overflow-hidden mb-3 bg-gray-100">
                <Image
                  src={model.image}
                  alt={model.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>

              {/* Model info */}
              <div className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-1 bg-accent/20 text-accent-dark">
                {model.brandName}
              </div>
              <h3 className="font-bold text-charcoal text-sm group-hover:text-accent-dark transition-colors">
                {model.name}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">{model.years}</p>

              <div className="mt-3 text-xs text-accent-dark font-semibold flex items-center gap-1">
                مشاهده قطعات
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3 rotate-180">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </a>
          ))}
        </SliderWrapper>
      </div>
    </section>
  );
}
