"use client";

import { useState, useTransition } from "react";
import {
  createCarBrand,
  updateCarBrand,
  deleteCarBrand,
  createCarModel,
  updateCarModel,
  deleteCarModel,
  createPartsBrand,
  updatePartsBrand,
  deletePartsBrand,
} from "@/actions/admin-brands";
import type {
  AdminCarBrandVM,
  AdminCarModelVM,
  AdminPartsBrandVM,
} from "@/actions/brands";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  FormError,
  Input,
  Select,
  TableShell,
  tableBodyClass,
  tableHeadClass,
  tableRowClass,
} from "@/src/components/admin/AdminUI";
import ImageUploadField, { AdminThumb } from "@/src/components/admin/ImageUploadField";

type Tab = "car-brands" | "car-models" | "parts-brands";

const TABS: { id: Tab; label: string }[] = [
  { id: "car-brands", label: "برند خودرو" },
  { id: "car-models", label: "مدل خودرو" },
  { id: "parts-brands", label: "برند قطعه" },
];

export default function BrandsManager({
  initialCarBrands,
  initialCarModels,
  initialPartsBrands,
}: {
  initialCarBrands: AdminCarBrandVM[];
  initialCarModels: AdminCarModelVM[];
  initialPartsBrands: AdminPartsBrandVM[];
}) {
  const [tab, setTab] = useState<Tab>("car-brands");

  return (
    <div>
      <div className="flex gap-1 mb-6 p-1 bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              "px-4 py-2.5 text-sm font-bold whitespace-nowrap rounded-xl transition-colors",
              tab === t.id
                ? "bg-accent text-charcoal shadow-sm"
                : "text-gray-500 hover:text-charcoal hover:bg-silver-light",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "car-brands" && <CarBrandsTab initial={initialCarBrands} />}
      {tab === "car-models" && <CarModelsTab initial={initialCarModels} carBrands={initialCarBrands} />}
      {tab === "parts-brands" && <PartsBrandsTab initial={initialPartsBrands} />}
    </div>
  );
}

function ActiveCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-semibold text-charcoal cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-accent"
      />
      فعال (نمایش در فروشگاه)
    </label>
  );
}

// ── Car brands ────────────────────────────────────────────────────────────────

function CarBrandsTab({ initial }: { initial: AdminCarBrandVM[] }) {
  const [items, setItems] = useState(initial);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    logoImage: "",
    isActive: true,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() {
    setEditingId(null);
    setForm({ name: "", slug: "", logoImage: "", isActive: true });
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const payload = {
        name: form.name,
        slug: form.slug,
        logoImage: form.logoImage || null,
        isActive: form.isActive,
      };
      if (editingId) {
        const result = await updateCarBrand(editingId, payload);
        if (!result.ok) return setError(result.error);
        setItems((prev) =>
          prev.map((b) => (b.id === editingId ? { ...b, ...payload } : b)),
        );
      } else {
        const result = await createCarBrand(payload);
        if (!result.ok) return setError(result.error);
        setItems((prev) => [
          ...prev,
          { id: result.data.id, ...payload, productCount: 0 },
        ]);
      }
      reset();
    });
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      const result = await deleteCarBrand(id);
      if (!result.ok) return setError(result.error);
      setItems((prev) => prev.filter((b) => b.id !== id));
    });
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader title={editingId ? "ویرایش برند خودرو" : "افزودن برند خودرو"} />
        <div className="p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <Input
                placeholder="نام برند خودرو (ایران خودرو)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                placeholder="اسلاگ (iran-khodro)"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                required
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={pending} className="flex-1">
                  {editingId ? "ذخیره" : "افزودن"}
                </Button>
                {editingId && (
                  <Button type="button" variant="ghost" onClick={reset}>
                    انصراف
                  </Button>
                )}
              </div>
            </div>
            <ImageUploadField
              folder="brands"
              label="لوگوی برند خودرو"
              value={form.logoImage}
              onChange={(url) => setForm({ ...form, logoImage: url })}
            />
            <ActiveCheckbox
              checked={form.isActive}
              onChange={(isActive) => setForm({ ...form, isActive })}
            />
          </form>
          {error && (
            <div className="mt-3">
              <FormError message={error} />
            </div>
          )}
        </div>
      </Card>

      {items.length === 0 ? (
        <Card>
          <EmptyState message="هنوز برند خودرویی ثبت نشده است." />
        </Card>
      ) : (
        <TableShell>
          <thead className={tableHeadClass}>
            <tr>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">
                تصویر
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">
                برند خودرو
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">
                اسلاگ
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">
                وضعیت
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">
                تعداد محصول
              </th>
              <th className="text-right px-4 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody className={tableBodyClass}>
            {items.map((b) => (
              <tr key={b.id} className={tableRowClass}>
                <td className="px-4 py-3">
                  <AdminThumb src={b.logoImage} alt={b.name} />
                </td>
                <td className="px-4 py-3 font-semibold text-charcoal">{b.name}</td>
                <td className="px-4 py-3 text-gray-500 font-mono">{b.slug}</td>
                <td className="px-4 py-3">
                  <Badge tone={b.isActive ? "success" : "warning"}>
                    {b.isActive ? "فعال" : "غیرفعال"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {b.productCount.toLocaleString("fa-IR")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(b.id);
                        setForm({
                          name: b.name,
                          slug: b.slug,
                          logoImage: b.logoImage ?? "",
                          isActive: b.isActive,
                        });
                      }}
                    >
                      ویرایش
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(b.id)}
                      disabled={pending}
                    >
                      حذف
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}

// ── Car models ────────────────────────────────────────────────────────────────

function CarModelsTab({
  initial,
  carBrands,
}: {
  initial: AdminCarModelVM[];
  carBrands: AdminCarBrandVM[];
}) {
  const [items, setItems] = useState(initial);
  const [form, setForm] = useState({
    carBrandId: carBrands[0]?.id ?? 0,
    name: "",
    image: "",
    isActive: true,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() {
    setEditingId(null);
    setForm({
      carBrandId: carBrands[0]?.id ?? 0,
      name: "",
      image: "",
      isActive: true,
    });
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const payload = {
      carBrandId: Number(form.carBrandId),
      name: form.name,
      image: form.image || null,
      isActive: form.isActive,
    };
    startTransition(async () => {
      if (editingId) {
        const result = await updateCarModel(editingId, payload);
        if (!result.ok) return setError(result.error);
        const brandName = carBrands.find((b) => b.id === payload.carBrandId)?.name ?? "";
        setItems((prev) =>
          prev.map((m) => (m.id === editingId ? { ...m, ...payload, brandName } : m)),
        );
      } else {
        const result = await createCarModel(payload);
        if (!result.ok) return setError(result.error);
        const brandName = carBrands.find((b) => b.id === payload.carBrandId)?.name ?? "";
        setItems((prev) => [
          ...prev,
          { id: result.data.id, ...payload, brandName },
        ]);
      }
      reset();
    });
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      const result = await deleteCarModel(id);
      if (!result.ok) return setError(result.error);
      setItems((prev) => prev.filter((m) => m.id !== id));
    });
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader title={editingId ? "ویرایش مدل خودرو" : "افزودن مدل خودرو"} />
        <div className="p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <Select
                value={form.carBrandId}
                onChange={(e) => setForm({ ...form, carBrandId: Number(e.target.value) })}
                required
                aria-label="برند خودرو"
              >
                {carBrands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
              <Input
                placeholder="مدل خودرو (پژو ۲۰۶)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={pending} className="flex-1">
                  {editingId ? "ذخیره" : "افزودن"}
                </Button>
                {editingId && (
                  <Button type="button" variant="ghost" onClick={reset}>
                    انصراف
                  </Button>
                )}
              </div>
            </div>
            <ImageUploadField
              folder="cars"
              label="تصویر خودرو"
              value={form.image}
              onChange={(url) => setForm({ ...form, image: url })}
            />
            <ActiveCheckbox
              checked={form.isActive}
              onChange={(isActive) => setForm({ ...form, isActive })}
            />
          </form>
          {error && (
            <div className="mt-3">
              <FormError message={error} />
            </div>
          )}
        </div>
      </Card>

      {items.length === 0 ? (
        <Card>
          <EmptyState message="هنوز مدل خودرویی ثبت نشده است." />
        </Card>
      ) : (
        <TableShell>
          <thead className={tableHeadClass}>
            <tr>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">
                تصویر
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">
                مدل خودرو
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">
                برند خودرو
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">
                وضعیت
              </th>
              <th className="text-right px-4 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody className={tableBodyClass}>
            {items.map((m) => (
              <tr key={m.id} className={tableRowClass}>
                <td className="px-4 py-3">
                  <AdminThumb src={m.image} alt={m.name} />
                </td>
                <td className="px-4 py-3 font-semibold text-charcoal">{m.name}</td>
                <td className="px-4 py-3 text-gray-500">{m.brandName}</td>
                <td className="px-4 py-3">
                  <Badge tone={m.isActive ? "success" : "warning"}>
                    {m.isActive ? "فعال" : "غیرفعال"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(m.id);
                        setForm({
                          carBrandId: m.carBrandId,
                          name: m.name,
                          image: m.image ?? "",
                          isActive: m.isActive,
                        });
                      }}
                    >
                      ویرایش
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(m.id)}
                      disabled={pending}
                    >
                      حذف
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}

// ── Parts brands ──────────────────────────────────────────────────────────────

function PartsBrandsTab({ initial }: { initial: AdminPartsBrandVM[] }) {
  const [items, setItems] = useState(initial);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    logoImage: "",
    isActive: true,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() {
    setEditingId(null);
    setForm({ name: "", slug: "", logoImage: "", isActive: true });
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const payload = {
        name: form.name,
        slug: form.slug,
        logoImage: form.logoImage || null,
        isActive: form.isActive,
      };
      if (editingId) {
        const result = await updatePartsBrand(editingId, payload);
        if (!result.ok) return setError(result.error);
        setItems((prev) =>
          prev.map((b) => (b.id === editingId ? { ...b, ...payload } : b)),
        );
      } else {
        const result = await createPartsBrand(payload);
        if (!result.ok) return setError(result.error);
        setItems((prev) => [...prev, { id: result.data.id, ...payload }]);
      }
      reset();
    });
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      const result = await deletePartsBrand(id);
      if (!result.ok) return setError(result.error);
      setItems((prev) => prev.filter((b) => b.id !== id));
    });
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader title={editingId ? "ویرایش برند قطعه" : "افزودن برند قطعه"} />
        <div className="p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <Input
                placeholder="نام برند (بوش)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                placeholder="اسلاگ (bosch)"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                required
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={pending} className="flex-1">
                  {editingId ? "ذخیره" : "افزودن"}
                </Button>
                {editingId && (
                  <Button type="button" variant="ghost" onClick={reset}>
                    انصراف
                  </Button>
                )}
              </div>
            </div>
            <ImageUploadField
              folder="brands"
              label="لوگوی برند"
              value={form.logoImage}
              onChange={(url) => setForm({ ...form, logoImage: url })}
            />
            <ActiveCheckbox
              checked={form.isActive}
              onChange={(isActive) => setForm({ ...form, isActive })}
            />
          </form>
          {error && (
            <div className="mt-3">
              <FormError message={error} />
            </div>
          )}
        </div>
      </Card>

      {items.length === 0 ? (
        <Card>
          <EmptyState message="هنوز برند قطعه‌ای ثبت نشده است." />
        </Card>
      ) : (
        <TableShell>
          <thead className={tableHeadClass}>
            <tr>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">
                تصویر
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">
                نام
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">
                اسلاگ
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">
                وضعیت
              </th>
              <th className="text-right px-4 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody className={tableBodyClass}>
            {items.map((b) => (
              <tr key={b.id} className={tableRowClass}>
                <td className="px-4 py-3">
                  <AdminThumb src={b.logoImage} alt={b.name} />
                </td>
                <td className="px-4 py-3 font-semibold text-charcoal">{b.name}</td>
                <td className="px-4 py-3 text-gray-500 font-mono">{b.slug}</td>
                <td className="px-4 py-3">
                  <Badge tone={b.isActive ? "success" : "warning"}>
                    {b.isActive ? "فعال" : "غیرفعال"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(b.id);
                        setForm({
                          name: b.name,
                          slug: b.slug,
                          logoImage: b.logoImage ?? "",
                          isActive: b.isActive,
                        });
                      }}
                    >
                      ویرایش
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(b.id)}
                      disabled={pending}
                    >
                      حذف
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}
