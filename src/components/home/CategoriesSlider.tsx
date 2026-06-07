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
        <div className="hidden lg:grid grid-cols-4 gap-4">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} cat={cat} />
          ))}
        </div>

        <div className="lg:hidden">
          <SliderWrapper>
            {categories.map((cat) => (
              <div key={cat.id} className="flex-shrink-0 w-40 sm:w-48">
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
      className="group rounded-2xl p-5 flex flex-col items-center text-center hover:shadow-lg transition-all duration-200 border border-transparent hover:border-current/10"
      style={{ backgroundColor: cat.bgColor }}
    >
      <span className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-200">
        {cat.icon}
      </span>
      <h3 className="font-bold text-sm mb-1" style={{ color: cat.color }}>
        {cat.name}
      </h3>
      <p className="text-xs font-medium" style={{ color: cat.color + "aa" }}>
        {cat.count.toLocaleString("fa-IR")} قطعه
      </p>
      <div
        className="mt-3 text-xs font-semibold px-3 py-1 rounded-full text-white transition-opacity opacity-0 group-hover:opacity-100"
        style={{ backgroundColor: cat.color }}
      >
        مشاهده همه
      </div>
    </a>
  );
}
