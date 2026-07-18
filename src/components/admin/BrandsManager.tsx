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
import type { AdminCarBrandVM, AdminCarModelVM } from "@/actions/brands";
import {
  Button,
  Card,
  EmptyState,
  FormError,
  Input,
  Select,
} from "@/src/components/admin/AdminUI";

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
  initialPartsBrands: { id: number; name: string }[];
}) {
  const [tab, setTab] = useState<Tab>("car-brands");

  return (
    <div>
      <div className="flex gap-2 mb-5 border-b border-gray-200 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              "px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 transition-colors",
              tab === t.id ? "border-accent text-accent-dark" : "border-transparent text-gray-400 hover:text-charcoal",
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

// ── Car brands ────────────────────────────────────────────────────────────────

function CarBrandsTab({ initial }: { initial: AdminCarBrandVM[] }) {
  const [items, setItems] = useState(initial);
  const [form, setForm] = useState({ name: "", slug: "", logoImage: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() {
    setEditingId(null);
    setForm({ name: "", slug: "", logoImage: "" });
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      if (editingId) {
        const result = await updateCarBrand(editingId, form);
        if (!result.ok) return setError(result.error);
        setItems((prev) => prev.map((b) => (b.id === editingId ? { ...b, ...form } : b)));
      } else {
        const result = await createCarBrand(form);
        if (!result.ok) return setError(result.error);
        setItems((prev) => [...prev, { id: result.data.id, ...form, productCount: 0 }]);
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
      <Card className="p-5 sm:p-6">
        <h2 className="font-bold text-charcoal mb-4">{editingId ? "ویرایش برند خودرو" : "افزودن برند خودرو"}</h2>
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-4 gap-3">
          <Input placeholder="نام (ایران خودرو)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input placeholder="اسلاگ (iran-khodro)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
          <Input placeholder="آدرس لوگو (اختیاری)" value={form.logoImage} onChange={(e) => setForm({ ...form, logoImage: e.target.value })} />
          <div className="flex gap-2">
            <Button type="submit" disabled={pending} className="flex-1">{editingId ? "ذخیره" : "افزودن"}</Button>
            {editingId && <Button type="button" variant="ghost" onClick={reset}>انصراف</Button>}
          </div>
        </form>
        {error && <div className="mt-3"><FormError message={error} /></div>}
      </Card>

      <Card className="overflow-hidden">
        {items.length === 0 ? (
          <EmptyState message="هنوز برند خودرویی ثبت نشده است." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-silver-light text-gray-500">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold">نام</th>
                  <th className="text-right px-4 py-3 font-semibold">اسلاگ</th>
                  <th className="text-right px-4 py-3 font-semibold">تعداد محصول</th>
                  <th className="text-right px-4 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 font-semibold text-charcoal">{b.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono">{b.slug}</td>
                    <td className="px-4 py-3 text-gray-500">{b.productCount.toLocaleString("fa-IR")}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingId(b.id); setForm({ name: b.name, slug: b.slug, logoImage: b.logoImage ?? "" }); }}
                          className="text-accent-dark font-semibold hover:underline"
                        >
                          ویرایش
                        </button>
                        <button onClick={() => handleDelete(b.id)} disabled={pending} className="text-red-600 font-semibold hover:underline disabled:opacity-50">
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
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
  const [form, setForm] = useState({ carBrandId: carBrands[0]?.id ?? 0, name: "", yearStart: "", yearEnd: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() {
    setEditingId(null);
    setForm({ carBrandId: carBrands[0]?.id ?? 0, name: "", yearStart: "", yearEnd: "" });
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const payload = {
      carBrandId: Number(form.carBrandId),
      name: form.name,
      yearStart: form.yearStart ? Number(form.yearStart) : null,
      yearEnd: form.yearEnd ? Number(form.yearEnd) : null,
    };
    startTransition(async () => {
      if (editingId) {
        const result = await updateCarModel(editingId, payload);
        if (!result.ok) return setError(result.error);
        const brandName = carBrands.find((b) => b.id === payload.carBrandId)?.name ?? "";
        setItems((prev) => prev.map((m) => (m.id === editingId ? { ...m, ...payload, brandName } : m)));
      } else {
        const result = await createCarModel(payload);
        if (!result.ok) return setError(result.error);
        const brandName = carBrands.find((b) => b.id === payload.carBrandId)?.name ?? "";
        setItems((prev) => [...prev, { id: result.data.id, ...payload, brandName, image: null }]);
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
      <Card className="p-5 sm:p-6">
        <h2 className="font-bold text-charcoal mb-4">{editingId ? "ویرایش مدل خودرو" : "افزودن مدل خودرو"}</h2>
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-5 gap-3">
          <Select value={form.carBrandId} onChange={(e) => setForm({ ...form, carBrandId: Number(e.target.value) })} required>
            {carBrands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
          <Input placeholder="نام مدل (پژو ۲۰۶)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input placeholder="سال شروع" inputMode="numeric" value={form.yearStart} onChange={(e) => setForm({ ...form, yearStart: e.target.value })} />
          <Input placeholder="سال پایان (خالی=فعلی)" inputMode="numeric" value={form.yearEnd} onChange={(e) => setForm({ ...form, yearEnd: e.target.value })} />
          <div className="flex gap-2">
            <Button type="submit" disabled={pending} className="flex-1">{editingId ? "ذخیره" : "افزودن"}</Button>
            {editingId && <Button type="button" variant="ghost" onClick={reset}>انصراف</Button>}
          </div>
        </form>
        {error && <div className="mt-3"><FormError message={error} /></div>}
      </Card>

      <Card className="overflow-hidden">
        {items.length === 0 ? (
          <EmptyState message="هنوز مدل خودرویی ثبت نشده است." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-silver-light text-gray-500">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold">مدل</th>
                  <th className="text-right px-4 py-3 font-semibold">برند</th>
                  <th className="text-right px-4 py-3 font-semibold">سال تولید</th>
                  <th className="text-right px-4 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-3 font-semibold text-charcoal">{m.name}</td>
                    <td className="px-4 py-3 text-gray-500">{m.brandName}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {m.yearStart ?? "—"} تا {m.yearEnd ?? "اکنون"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingId(m.id);
                            setForm({
                              carBrandId: m.carBrandId,
                              name: m.name,
                              yearStart: m.yearStart?.toString() ?? "",
                              yearEnd: m.yearEnd?.toString() ?? "",
                            });
                          }}
                          className="text-accent-dark font-semibold hover:underline"
                        >
                          ویرایش
                        </button>
                        <button onClick={() => handleDelete(m.id)} disabled={pending} className="text-red-600 font-semibold hover:underline disabled:opacity-50">
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Parts brands ──────────────────────────────────────────────────────────────

function PartsBrandsTab({ initial }: { initial: { id: number; name: string }[] }) {
  const [items, setItems] = useState(initial);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      if (editingId) {
        const result = await updatePartsBrand(editingId, { name });
        if (!result.ok) return setError(result.error);
        setItems((prev) => prev.map((b) => (b.id === editingId ? { ...b, name } : b)));
      } else {
        const result = await createPartsBrand(name);
        if (!result.ok) return setError(result.error);
        setItems((prev) => [...prev, { id: result.data.id, name }]);
      }
      setEditingId(null);
      setName("");
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
      <Card className="p-5 sm:p-6">
        <h2 className="font-bold text-charcoal mb-4">{editingId ? "ویرایش برند قطعه" : "افزودن برند قطعه"}</h2>
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-4 gap-3">
          <Input placeholder="نام برند (بوش)" value={name} onChange={(e) => setName(e.target.value)} required className="sm:col-span-2" />
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={pending} className="flex-1">{editingId ? "ذخیره" : "افزودن"}</Button>
            {editingId && <Button type="button" variant="ghost" onClick={() => { setEditingId(null); setName(""); }}>انصراف</Button>}
          </div>
        </form>
        {error && <div className="mt-3"><FormError message={error} /></div>}
      </Card>

      <Card className="overflow-hidden">
        {items.length === 0 ? (
          <EmptyState message="هنوز برند قطعه‌ای ثبت نشده است." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-silver-light text-gray-500">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold">نام</th>
                  <th className="text-right px-4 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 font-semibold text-charcoal">{b.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditingId(b.id); setName(b.name); }} className="text-accent-dark font-semibold hover:underline">
                          ویرایش
                        </button>
                        <button onClick={() => handleDelete(b.id)} disabled={pending} className="text-red-600 font-semibold hover:underline disabled:opacity-50">
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
