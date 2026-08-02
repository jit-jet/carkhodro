import { Suspense } from "react";
import type { Metadata } from "next";
import {
  getReviewsAdmin,
  getSupportMessagesAdmin,
  getSuggestionsAdmin,
  getAdminCommunicationCounts,
} from "@/actions/admin-communications";
import { PageHeader } from "@/src/components/admin/AdminUI";
import AdminPagination from "@/src/components/admin/AdminPagination";
import CommunicationsPanel, {
  type CommunicationsTab,
} from "@/src/components/admin/CommunicationsPanel";
import { parsePage, parsePerPage, pickSearchParam } from "@/src/lib/admin-pagination";
import { formatNumberFa } from "@/src/lib/format";

export const metadata: Metadata = { title: "مدیریت ارتباطات | پنل مدیریت" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseTab(value: string): CommunicationsTab {
  if (value === "support" || value === "suggestions" || value === "reviews") return value;
  return "reviews";
}

export default function AdminCommunicationsPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<CommunicationsSkeleton />}>
      <CommunicationsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function CommunicationsContent({ searchParams }: Props) {
  const sp = await searchParams;
  const tab = parseTab(pickSearchParam(sp.tab));
  const unreadOnly = pickSearchParam(sp.unread) === "1";
  const page = parsePage(sp.page);
  const perPage = parsePerPage(sp.perPage);

  const counts = await getAdminCommunicationCounts();

  const listQuery = { unreadOnly, page, perPage };
  const [reviews, support, suggestions] = await Promise.all([
    tab === "reviews"
      ? getReviewsAdmin(listQuery)
      : Promise.resolve({ items: [], total: 0, page, perPage, pageCount: 1, unreadCount: 0 }),
    tab === "support"
      ? getSupportMessagesAdmin(listQuery)
      : Promise.resolve({ items: [], total: 0, page, perPage, pageCount: 1, unreadCount: 0 }),
    tab === "suggestions"
      ? getSuggestionsAdmin(listQuery)
      : Promise.resolve({ items: [], total: 0, page, perPage, pageCount: 1, unreadCount: 0 }),
  ]);

  const active =
    tab === "reviews" ? reviews : tab === "support" ? support : suggestions;

  const totalUnread =
    counts.unreadReviews + counts.unreadSupport + counts.unreadSuggestions;

  return (
    <div>
      <PageHeader
        title="مدیریت ارتباطات"
        description={
          totalUnread > 0
            ? `${formatNumberFa(totalUnread)} مورد خوانده‌نشده`
            : "نظرات، پیام‌های پشتیبانی و پیشنهادات کالا"
        }
      />

      <CommunicationsPanel
        tab={tab}
        reviews={reviews.items}
        support={support.items}
        suggestions={suggestions.items}
        counts={counts}
        unreadOnly={unreadOnly}
        perPage={perPage}
      />

      <AdminPagination
        page={active.page}
        pageCount={active.pageCount}
        total={active.total}
        perPage={active.perPage}
        pathname="/admin/communications"
        query={{
          ...(tab !== "reviews" ? { tab } : {}),
          ...(unreadOnly ? { unread: "1" } : {}),
        }}
      />
    </div>
  );
}

function CommunicationsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-72 bg-gray-100 rounded-xl animate-pulse" />
      <div className="flex gap-2">
        <div className="h-10 w-32 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-10 w-40 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-10 w-36 bg-gray-100 rounded-xl animate-pulse" />
      </div>
      <div className="h-96 bg-white rounded-2xl border border-gray-100 animate-pulse" />
    </div>
  );
}
