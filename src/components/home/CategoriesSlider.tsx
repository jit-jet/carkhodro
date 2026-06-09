import SliderWrapper from "@/src/components/ui/SliderWrapper";
import SectionTitle from "@/src/components/ui/SectionTitle";
import { getCategories } from "@/actions/categories";
import type { CategoryVM } from "@/src/lib/serializers";

export default async function CategoriesSlider() {
  const categories = await getCategories();
  return (
    <section className="py-10 bg-silver-light">
      <div className="max-w-7xl mx-auto px-4">
        <SectionTitle
          title="دسته‌بندی قطعات"
          subtitle="قطعه مورد نظر خود را بر اساس دسته‌بندی پیدا کنید"
          linkHref="/products"
          linkLabel="همه دسته‌بندی‌ها"
        />

        {/* Desktop: full grid; Mobile/tablet: scrollable slider */}
        <div className="hidden lg:grid grid-cols-4 gap-5">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} cat={cat} />
          ))}
        </div>

        <div className="lg:hidden">
          <SliderWrapper>
            {categories.map((cat) => (
              <div key={cat.id} className="shrink-0 w-40 sm:w-48">
                <CategoryCard cat={cat} />
              </div>
            ))}
          </SliderWrapper>
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ cat }: { cat: CategoryVM }) {
  return (
    <a
      href={`/products?category=${cat.key}`}
      className="group rounded-2xl overflow-hidden bg-white border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col"
    >
      <div className="relative h-36 overflow-hidden bg-gray-50">
        <img
          src={cat.image}
          alt={cat.name}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-200"
        />
      </div>
      <div className="p-4 flex flex-col items-center text-center border-t border-gray-50">
        <h3 className="font-bold text-sm text-gray-800 mb-1">{cat.name}</h3>
        <p className="text-xs text-gray-400">
          {cat.count.toLocaleString("fa-IR")} قطعه
        </p>
        <div className="mt-3 text-xs font-semibold px-3 py-1 rounded-full bg-orange-500 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          مشاهده همه
        </div>
      </div>
    </a>
  );
}
