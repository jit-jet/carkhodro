import type { Metadata } from "next";
import { getAllShippingOptions } from "@/actions/navigation";
import { PageHeader } from "@/src/components/admin/AdminUI";
import ShippingOptionsManager from "@/src/components/admin/ShippingOptionsManager";

export const metadata: Metadata = { title: "روش‌های ارسال | پنل مدیریت" };

export default async function AdminShippingPage() {
  const options = await getAllShippingOptions();

  return (
    <div>
      <PageHeader
        title="روش‌های ارسال"
        description="مدیریت روش‌های ارسال نمایش‌داده‌شده در تسویه‌حساب"
      />
      <ShippingOptionsManager initialOptions={options} />
    </div>
  );
}
