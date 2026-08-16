"use client";

/**
 * Create/edit product form — implements the pricing logic from the spec:
 *   1. Wholesale price (قیمت کلی فروشی) is the baseline the admin enters.
 *   2. Retail price (قیمت تک‌فروشی) is *calculated*: wholesale × (1 + diff%).
 *   3. The wholesale↔retail difference is set via `retailPriceDiffPct` (%).
 *   4. Retail and partner (wholesale) discounts are set independently.
 * A live preview panel below the pricing fields shows all four resulting
 * prices as the admin types, using the same pure functions the storefront
 * uses (`src/lib/pricing.ts`) so the preview can never drift from reality.
 */

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createProduct,
  permanentlyDeleteProduct,
  updateProduct,
  uploadProductImage,
  type ProductInput,
} from "@/actions/admin-products";
import { computeRetailPrice, computeRetailFinal, computeWholesaleFinal } from "@/src/lib/pricing";
import { formatToman } from "@/src/lib/format";
import { useCartUI } from "@/src/store/cart-ui";
import {
  Button,
  Card,
  CardHeader,
  FormError,
  FormSuccess,
  Input,
  Label,
  Select,
  Textarea,
} from "@/src/components/admin/AdminUI";

export interface ProductFormInitial extends ProductInput {
  id?: string;
  isActive?: boolean;
  images?: string[];
}

const MAX_GALLERY_IMAGES = 10;

function initialGallery(initial: ProductFormInitial): string[] {
  const fromImages = (initial.images ?? []).filter(Boolean);
  if (fromImages.length > 0) return fromImages;
  return initial.mainImage ? [initial.mainImage] : [];
}

export default function ProductForm({
  initial,
  categories,
  partsBrands,
  carModels,
}: {
  initial: ProductFormInitial;
  categories: { id: number; name: string }[];
  partsBrands: { id: number; name: string }[];
  carModels: { id: number; name: string; brandName: string }[];
}) {
  const router = useRouter();
  const notify = useCartUI((s) => s.notify);
  const fileRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(initial.id);

  const [sku] = useState(initial.sku ?? "");
  const [name, setName] = useState(initial.name);
  const [partsBrandId, setPartsBrandId] = useState(initial.partsBrandId || partsBrands[0]?.id || 0);
  const [categoryId, setCategoryId] = useState(initial.categoryId || categories[0]?.id || 0);
  const [carModelIds, setCarModelIds] = useState<number[]>(() =>
    [...new Set((initial.carModelIds ?? []).filter((id) => Number.isFinite(id) && id > 0))],
  );
  const [wholesalePrice, setWholesalePrice] = useState(String(initial.wholesalePrice ?? ""));
  const [buyPrice, setBuyPrice] = useState(
    initial.buyPrice != null && initial.buyPrice > 0 ? String(initial.buyPrice) : "",
  );
  const [wholesaleDiscountPct, setWholesaleDiscountPct] = useState(String(initial.wholesaleDiscountPct ?? 0));
  const [retailPriceDiffPct, setRetailPriceDiffPct] = useState(String(initial.retailPriceDiffPct ?? 25));
  const [retailDiscountPct, setRetailDiscountPct] = useState(String(initial.retailDiscountPct ?? 0));
  const [stock, setStock] = useState(String(initial.stock ?? 0));
  const [origin, setOrigin] = useState(initial.origin ?? "");
  const [unit, setUnit] = useState(initial.unit?.trim() || "عدد");
  const [images, setImages] = useState<string[]>(() => initialGallery(initial));
  const [mainImage, setMainImage] = useState(
    () => initial.mainImage || initialGallery(initial)[0] || "",
  );
  const [description, setDescription] = useState(initial.description ?? "");
  const [metaTitle, setMetaTitle] = useState(initial.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(initial.metaDescription ?? "");
  const [imageAlt, setImageAlt] = useState(initial.imageAlt ?? "");
  const [isOffer, setIsOffer] = useState(initial.isOffer ?? false);
  const [callForPriceRetail, setCallForPriceRetail] = useState(
    initial.callForPriceRetail ?? false,
  );
  const [callForPriceWholesale, setCallForPriceWholesale] = useState(
    initial.callForPriceWholesale ?? false,
  );
  const [isActive, setIsActive] = useState(initial.isActive ?? true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imageError, setImageError] = useState("");
  const [pending, startTransition] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [uploading, startUpload] = useTransition();
  const [dragOver, setDragOver] = useState(false);

  const preview = useMemo(() => {
    const fields = {
      wholesalePrice: Number(wholesalePrice) || 0,
      wholesaleDiscountPct: Number(wholesaleDiscountPct) || 0,
      retailPriceDiffPct: Number(retailPriceDiffPct) || 0,
      retailDiscountPct: Number(retailDiscountPct) || 0,
    };
    return {
      retailPrice: computeRetailPrice(fields),
      retailFinal: computeRetailFinal(fields),
      wholesaleFinal: computeWholesaleFinal(fields),
    };
  }, [wholesalePrice, wholesaleDiscountPct, retailPriceDiffPct, retailDiscountPct]);

  function addUploadedUrls(urls: string[]) {
    if (urls.length === 0) return;
    setImages((prev) => {
      const next = [...prev];
      for (const url of urls) {
        if (!next.includes(url) && next.length < MAX_GALLERY_IMAGES) next.push(url);
      }
      return next;
    });
    setMainImage((current) => current || urls[0] || "");
  }

  async function uploadFiles(files: FileList | File[]) {
    setImageError("");
    const list = Array.from(files).filter((f) => f.size > 0);
    if (list.length === 0) return;

    const remaining = MAX_GALLERY_IMAGES - images.length;
    if (remaining <= 0) {
      const msg = `حداکثر ${MAX_GALLERY_IMAGES.toLocaleString("fa-IR")} تصویر مجاز است.`;
      setImageError(msg);
      notify({ variant: "error", title: "خطا", description: msg });
      return;
    }

    const toUpload = list.slice(0, remaining);
    startUpload(async () => {
      const uploaded: string[] = [];
      for (const file of toUpload) {
        const form = new FormData();
        form.set("image", file);
        const result = await uploadProductImage(form);
        if (!result.ok) {
          setImageError(result.error);
          notify({ variant: "error", title: "خطا", description: result.error });
          break;
        }
        uploaded.push(result.data.url);
      }
      addUploadedUrls(uploaded);
      if (uploaded.length > 0) {
        notify({
          variant: "success",
          title: "آپلود موفق",
          description: `${uploaded.length.toLocaleString("fa-IR")} تصویر افزوده شد.`,
        });
      }
      if (list.length > remaining) {
        const msg = `فقط ${remaining.toLocaleString("fa-IR")} تصویر دیگر قابل افزودن بود.`;
        setImageError(msg);
        notify({ variant: "error", title: "محدودیت تصویر", description: msg });
      }
    });
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files?.length) void uploadFiles(files);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeImage(url: string) {
    setImages((prev) => {
      const next = prev.filter((u) => u !== url);
      setMainImage((current) => (current === url ? next[0] ?? "" : current));
      return next;
    });
  }

  function handlePermanentDelete() {
    if (!initial.id) return;
    if (
      !window.confirm(
        `محصول «${name}» از حسابفا و فروشگاه، به‌همراه همه تصاویر، برای همیشه حذف شود؟ این عمل قابل بازگشت نیست.`,
      )
    ) {
      return;
    }
    setError("");
    setSuccess("");
    startDelete(async () => {
      const result = await permanentlyDeleteProduct(initial.id!);
      if (!result.ok) {
        setError(result.error);
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }
      notify({
        variant: "success",
        title: "حذف شد",
        description: "محصول از حسابفا و فروشگاه حذف شد و تصاویر مرتبط نیز پاک شدند.",
      });
      router.push("/admin/products");
      router.refresh();
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const orderedImages =
      mainImage && images.includes(mainImage)
        ? [mainImage, ...images.filter((u) => u !== mainImage)]
        : images;

    const input: ProductInput = {
      name,
      partsBrandId: Number(partsBrandId),
      categoryId: Number(categoryId),
      carModelIds,
      wholesalePrice: Number(wholesalePrice),
      buyPrice: buyPrice.trim() === "" ? null : Number(buyPrice),
      wholesaleDiscountPct: Number(wholesaleDiscountPct),
      retailPriceDiffPct: Number(retailPriceDiffPct),
      retailDiscountPct: Number(retailDiscountPct),
      stock: Number(stock),
      origin: origin || null,
      unit: unit.trim() || "عدد",
      mainImage: mainImage || orderedImages[0] || null,
      images: orderedImages,
      description: description || null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      imageAlt: imageAlt || null,
      isOffer,
      callForPriceRetail,
      callForPriceWholesale,
    };

    startTransition(async () => {
      const result = isEditing
        ? await updateProduct(initial.id!, { ...input, isActive })
        : await createProduct(input);
      if (!result.ok) {
        setError(result.error);
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }

      const successMessage = isEditing
        ? "محصول با موفقیت به‌روزرسانی شد."
        : "محصول با موفقیت ایجاد شد.";
      setSuccess(successMessage);
      notify({
        variant: "success",
        title: "ذخیره موفق",
        description: successMessage,
      });
      if (!isEditing && result.data?.id) {
        router.push(`/admin/products/${result.data.id}`);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <FormError message={error} />}
      {success && <FormSuccess message={success} />}

      <Card className="overflow-hidden">
        <CardHeader title="اطلاعات پایه" />
        <div className="p-5 sm:p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>کد کالا (SKU)</Label>
            <Input
              value={isEditing ? sku : ""}
              readOnly
              disabled
              placeholder={isEditing ? undefined : "پس از ذخیره، توسط حسابفا تولید می‌شود"}
            />
            <p className="text-xs text-gray-500 mt-1.5 leading-5">
              {isEditing
                ? "کد کالا توسط حسابفا تولید شده و قابل ویرایش نیست."
                : "کد کالا هنگام ذخیره توسط حسابفا تولید می‌شود و به‌صورت خودکار ثبت می‌گردد."}
            </p>
          </div>
          <div>
            <Label>نام محصول</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>برند قطعه</Label>
            <Select value={partsBrandId} onChange={(e) => setPartsBrandId(Number(e.target.value))} required>
              {partsBrands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>دسته‌بندی</Label>
            <Select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} required>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>مدل‌های خودرو سازگار</Label>
            <p className="text-xs text-gray-400 mb-2">
              می‌توانید چند مدل را انتخاب کنید. خالی = بدون سازگاری مشخص.
            </p>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white divide-y divide-gray-50">
              {carModels.length === 0 ? (
                <p className="px-3 py-3 text-sm text-gray-400">مدلی ثبت نشده است.</p>
              ) : (
                carModels.map((m) => {
                  const checked = carModelIds.includes(m.id);
                  return (
                    <label
                      key={m.id}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-charcoal cursor-pointer hover:bg-silver-light/60"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setCarModelIds((prev) =>
                            checked ? prev.filter((id) => id !== m.id) : [...prev, m.id],
                          );
                        }}
                        className="w-4 h-4 accent-accent shrink-0"
                      />
                      <span>
                        <span className="font-medium">{m.brandName}</span>
                        <span className="text-gray-400"> — </span>
                        {m.name}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
            {carModelIds.length > 0 && (
              <p className="mt-2 text-xs text-gray-500">
                {carModelIds.length.toLocaleString("fa-IR")} مدل انتخاب شده
              </p>
            )}
          </div>
          <div>
            <Label>کشور سازنده (اختیاری)</Label>
            <Input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="آلمان، ژاپن، ایران…" />
          </div>
          <div>
            <Label>واحد</Label>
            <Input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="عدد"
              required
            />
          </div>
          <div>
            <Label>موجودی انبار</Label>
            <Input type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} required />
          </div>
        </div>

        <div>
          <Label>تصاویر محصول</Label>
          <p className="text-xs text-gray-500 mb-3 leading-6">
            چند تصویر آپلود کنید و یکی را به‌عنوان تصویر اصلی انتخاب کنید. همه تصاویر در گالری صفحه محصول نمایش داده می‌شوند.
          </p>

          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileRef.current?.click();
              }
            }}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files);
            }}
            className={[
              "rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors cursor-pointer",
              dragOver
                ? "border-accent bg-amber-50"
                : "border-gray-200 bg-silver-light/60 hover:border-accent/60 hover:bg-amber-50/40",
              uploading ? "opacity-60 pointer-events-none" : "",
            ].join(" ")}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageChange}
              disabled={uploading}
              className="hidden"
            />
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white border border-gray-200 text-accent-dark">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm font-bold text-charcoal">
              {uploading ? "در حال آپلود…" : "کلیک یا رها کردن فایل‌ها برای آپلود"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              jpg، png یا webp — حداکثر ۲ مگابایت — تا {MAX_GALLERY_IMAGES.toLocaleString("fa-IR")} تصویر
            </p>
          </div>

          {imageError && <p className="text-xs text-red-600 mt-2">{imageError}</p>}

          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((url) => {
                const isMain = url === mainImage;
                return (
                  <div
                    key={url}
                    className={[
                      "relative group rounded-xl overflow-hidden border bg-white",
                      isMain ? "border-accent ring-2 ring-accent/30" : "border-gray-200",
                    ].join(" ")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full aspect-square object-cover" />
                    {isMain && (
                      <span className="absolute top-2 right-2 text-[10px] font-bold bg-accent text-charcoal px-2 py-0.5 rounded-lg">
                        تصویر اصلی
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-2 flex gap-1.5 bg-gradient-to-t from-black/70 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      {!isMain && (
                        <button
                          type="button"
                          onClick={() => setMainImage(url)}
                          className="flex-1 text-[11px] font-bold bg-white/95 text-charcoal rounded-lg py-1.5 hover:bg-white"
                        >
                          انتخاب به‌عنوان اصلی
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className={[
                          "text-[11px] font-bold bg-red-500 text-white rounded-lg py-1.5 hover:bg-red-600",
                          isMain ? "flex-1" : "px-2.5",
                        ].join(" ")}
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <Label>توضیحات (اختیاری)</Label>
          <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="سئوی محصول" description="Canonical و داده‌های ساختاریافته محصول، برند، قیمت، موجودی، نظرها و breadcrumb خودکار هستند." />
        <div className="p-5 sm:p-6 space-y-4">
          <div><Label>عنوان سئو</Label><Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder={name} /></div>
          <div><Label>توضیحات متا</Label><Textarea rows={3} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} /></div>
          <div><Label>متن جایگزین تصویر</Label><Input value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} placeholder={name} /></div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          title="قیمت‌گذاری"
          description="قیمت کلی فروشی (عمده) پایه محاسبات است. قیمت تک‌فروشی به‌صورت خودکار از روی درصد اختلاف محاسبه می‌شود."
        />
        <div className="p-5 sm:p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>قیمت کلی فروشی — پایه (تومان)</Label>
            <Input
              type="number"
              min={0}
              value={wholesalePrice}
              onChange={(e) => setWholesalePrice(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>قیمت خرید (اختیاری — تومان)</Label>
            <Input
              type="number"
              min={0}
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              placeholder="اختیاری"
            />
          </div>
          <div>
            <Label>اختلاف قیمت همکار با تک‌فروشی (٪)</Label>
            <Input
              type="number"
              min={0}
              max={1000}
              value={retailPriceDiffPct}
              onChange={(e) => setRetailPriceDiffPct(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>تخفیف همکار / عمده (٪)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={wholesaleDiscountPct}
              onChange={(e) => setWholesaleDiscountPct(e.target.value)}
            />
          </div>
          <div>
            <Label>تخفیف تک‌فروشی (٪)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={retailDiscountPct}
              onChange={(e) => setRetailDiscountPct(e.target.value)}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 bg-gray-50 rounded-xl border border-gray-100 p-4">
          <PricePreview label="قیمت نهایی همکار (عمده)" value={preview.wholesaleFinal} />
          <PricePreview label="قیمت لیست تک‌فروشی" value={preview.retailPrice} />
          <PricePreview label="قیمت نهایی تک‌فروشی" value={preview.retailFinal} highlight />
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-charcoal cursor-pointer">
            <input type="checkbox" checked={isOffer} onChange={(e) => setIsOffer(e.target.checked)} className="w-4 h-4 accent-accent" />
            پیشنهاد ویژه
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-charcoal cursor-pointer">
            <input
              type="checkbox"
              checked={callForPriceRetail}
              onChange={(e) => setCallForPriceRetail(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            تماس برای قیمت — تک‌فروشی
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-charcoal cursor-pointer">
            <input
              type="checkbox"
              checked={callForPriceWholesale}
              onChange={(e) => setCallForPriceWholesale(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            تماس برای قیمت — عمده
          </label>
          {isEditing && (
            <label className="flex items-center gap-2 text-sm font-semibold text-charcoal cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 accent-accent" />
              فعال (نمایش در فروشگاه)
            </label>
          )}
        </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3 sticky bottom-4 z-10 bg-white/90 backdrop-blur-sm border border-gray-200/80 rounded-2xl shadow-sm px-4 py-3 w-fit">
        <Button type="submit" disabled={pending || uploading || deleting}>
          {pending ? "در حال ذخیره…" : isEditing ? "ذخیره تغییرات" : "افزودن محصول"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={pending || deleting}
          onClick={() => router.push("/admin/products")}
        >
          بازگشت
        </Button>
        {isEditing && (
          <Button
            type="button"
            variant="danger"
            disabled={pending || uploading || deleting}
            onClick={handlePermanentDelete}
          >
            {deleting ? "در حال حذف…" : "حذف محصول"}
          </Button>
        )}
      </div>
    </form>
  );
}

function PricePreview({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`font-extrabold tabular-nums ${highlight ? "text-accent-dark text-lg" : "text-charcoal"}`}>
        {formatToman(value)}
      </p>
    </div>
  );
}
