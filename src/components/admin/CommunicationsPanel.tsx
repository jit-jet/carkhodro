"use client";

/**
 * Admin communications panel — three tabs:
 * 1. Product comments (reviews) — view + reply
 * 2. Support messages — view + reply
 * 3. Product suggestions — view only
 */

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getSupportThreadAdmin,
  markReviewReadAdmin,
  markSuggestionReadAdmin,
  markSupportMessageReadAdmin,
  replyToReviewAdmin,
  replyToSupportMessageAdmin,
  type AdminReviewListItemVM,
  type AdminSuggestionListItemVM,
  type AdminSupportListItemVM,
  type AdminSupportThreadMessageVM,
} from "@/actions/admin-communications";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FormError,
  FormSuccess,
  Label,
  Textarea,
} from "@/src/components/admin/AdminUI";
import { formatNumberFa } from "@/src/lib/format";
import { useCartUI } from "@/src/store/cart-ui";

export type CommunicationsTab = "reviews" | "support" | "suggestions";

interface Props {
  tab: CommunicationsTab;
  reviews: AdminReviewListItemVM[];
  support: AdminSupportListItemVM[];
  suggestions: AdminSuggestionListItemVM[];
  counts: {
    unreadReviews: number;
    unreadSupport: number;
    unreadSuggestions: number;
  };
  unreadOnly: boolean;
}

const TABS: { key: CommunicationsTab; label: string; countKey: keyof Props["counts"] }[] = [
  { key: "reviews", label: "نظرات سایت", countKey: "unreadReviews" },
  { key: "support", label: "پیام‌های پشتیبانی", countKey: "unreadSupport" },
  { key: "suggestions", label: "پیشنهادات کالا", countKey: "unreadSuggestions" },
];

export default function CommunicationsPanel({
  tab,
  reviews,
  support,
  suggestions,
  counts,
  unreadOnly,
}: Props) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => {
          const active = tab === t.key;
          const badge = counts[t.countKey];
          return (
            <Link
              key={t.key}
              href={`/admin/communications?tab=${t.key}${unreadOnly ? "&unread=1" : ""}`}
              className={[
                "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition-colors border",
                active
                  ? "bg-accent text-charcoal border-accent shadow-sm shadow-accent/20"
                  : "bg-white text-charcoal border-gray-200 hover:bg-silver-light",
              ].join(" ")}
            >
              {t.label}
              {badge > 0 && (
                <span className="min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {formatNumberFa(badge)}
                </span>
              )}
            </Link>
          );
        })}
        <label className="ms-auto inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-charcoal cursor-pointer select-none hover:bg-silver-light transition-colors">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => {
              const next = e.target.checked;
              router.push(
                `/admin/communications?tab=${tab}${next ? "&unread=1" : ""}`,
              );
            }}
            className="w-3.5 h-3.5 rounded border-gray-300 text-accent accent-accent cursor-pointer"
          />
          فقط خوانده‌نشده
        </label>
      </div>

      {tab === "reviews" && <ReviewsPane items={reviews} />}
      {tab === "support" && <SupportPane items={support} />}
      {tab === "suggestions" && <SuggestionsPane items={suggestions} />}
    </div>
  );
}

function ReviewsPane({ items }: { items: AdminReviewListItemVM[] }) {
  const router = useRouter();
  const notify = useCartUI((s) => s.notify);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, startTransition] = useTransition();

  const open = useMemo(() => items.find((i) => i.id === openId) ?? null, [items, openId]);

  function openItem(item: AdminReviewListItemVM) {
    setOpenId((prev) => (prev === item.id ? null : item.id));
    setReply(item.adminReply ?? "");
    setError("");
    setSuccess("");
    if (!item.isRead) {
      startTransition(async () => {
        await markReviewReadAdmin(item.id);
        router.refresh();
      });
    }
  }

  function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!open) return;
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await replyToReviewAdmin({ id: open.id, reply });
      if (!result.ok) {
        setError(result.error);
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }
      setSuccess("پاسخ ثبت شد.");
      notify({ variant: "success", title: "پاسخ ثبت شد", description: "پاسخ زیر نظر در صفحه محصول نمایش داده می‌شود." });
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <Card>
        <EmptyState message="نظری برای نمایش وجود ندارد." />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-gray-50">
        {items.map((item) => {
          const isOpen = openId === item.id;
          return (
            <li
              key={item.id}
              className={[
                "transition-colors",
                isOpen
                  ? "bg-amber-50/40 ring-2 ring-inset ring-accent border-y border-accent/40"
                  : "",
              ].join(" ")}
            >
              <div
                className={[
                  "flex items-start gap-3 px-5 py-4 transition-colors",
                  isOpen ? "bg-amber-50/50" : "hover:bg-silver-light/60",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={() => openItem(item)}
                  className="flex flex-1 items-start gap-3 min-w-0 text-start"
                  aria-expanded={isOpen}
                >
                  <span
                    className={[
                      "w-2 h-2 rounded-full shrink-0 mt-2",
                      item.isRead ? "bg-transparent" : "bg-accent",
                    ].join(" ")}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={[
                          "text-sm",
                          item.isRead ? "font-medium text-gray-700" : "font-bold text-charcoal",
                        ].join(" ")}
                      >
                        {item.authorName}
                      </span>
                      <Badge tone="default">{item.rating} ★</Badge>
                      {item.hasReply ? <Badge tone="success">پاسخ داده شده</Badge> : null}
                      {item.isVerifiedPurchase ? <Badge tone="warning">خریدار تأیید شده</Badge> : null}
                      {isOpen ? <Badge tone="warning">در حال پاسخ</Badge> : null}
                    </span>
                    <span className="block text-xs text-gray-400 mb-1">
                      {item.productSku} · {item.date}
                    </span>
                    <span className="block text-sm text-gray-600 line-clamp-2">{item.text}</span>
                  </span>
                </button>
                <Link
                  href={`/products/${item.productId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 max-w-[11rem] sm:max-w-[14rem] text-xs font-bold text-accent-dark hover:underline text-end leading-5"
                  title={item.productName}
                >
                  <span className="line-clamp-2">{item.productName}</span>
                </Link>
              </div>

              {isOpen && open && (
                <div className="px-5 pb-5 pt-1 bg-amber-50/30 border-t border-accent/20 space-y-4">
                  <div className="rounded-xl bg-white border border-accent/30 p-4">
                    <Link
                      href={`/products/${open.productId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mb-3 text-sm font-bold text-accent-dark hover:underline"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4 shrink-0"
                        aria-hidden="true"
                      >
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      {open.productName}
                      <span className="text-xs font-medium text-gray-400">({open.productSku})</span>
                    </Link>
                    <p className="text-sm text-charcoal leading-7 whitespace-pre-wrap">{open.text}</p>
                  </div>

                  <form onSubmit={submitReply} className="space-y-3">
                    <div>
                      <Label>پاسخ فروشگاه</Label>
                      <Textarea
                        rows={4}
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="پاسخ خود را بنویسید…"
                        disabled={pending}
                      />
                    </div>
                    <FormError message={error} />
                    <FormSuccess message={success} />
                    <Button type="submit" disabled={pending || !reply.trim()}>
                      {pending ? "در حال ذخیره…" : open.hasReply ? "به‌روزرسانی پاسخ" : "ثبت پاسخ"}
                    </Button>
                  </form>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function SupportPane({ items }: { items: AdminSupportListItemVM[] }) {
  const router = useRouter();
  const notify = useCartUI((s) => s.notify);
  const [openId, setOpenId] = useState<string | null>(null);
  const [thread, setThread] = useState<AdminSupportThreadMessageVM[]>([]);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, startTransition] = useTransition();

  const open = useMemo(() => items.find((i) => i.id === openId) ?? null, [items, openId]);

  function openItem(item: AdminSupportListItemVM) {
    const closing = openId === item.id;
    setOpenId(closing ? null : item.id);
    setReply("");
    setError("");
    setSuccess("");
    if (closing) {
      setThread([]);
      return;
    }

    startTransition(async () => {
      if (!item.isRead) {
        await markSupportMessageReadAdmin(item.id);
      }
      const messages = await getSupportThreadAdmin(item.userId);
      setThread(messages);
      router.refresh();
    });
  }

  function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!open) return;
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await replyToSupportMessageAdmin({
        messageId: open.id,
        body: reply,
      });
      if (!result.ok) {
        setError(result.error);
        notify({ variant: "error", title: "خطا", description: result.error });
        return;
      }
      setSuccess("پاسخ ارسال شد.");
      setReply("");
      notify({
        variant: "success",
        title: "پاسخ ارسال شد",
        description: "پیام در صندوق پشتیبانی کاربر نمایش داده می‌شود.",
      });
      const messages = await getSupportThreadAdmin(open.userId);
      setThread(messages);
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <Card>
        <EmptyState message="پیام پشتیبانی برای نمایش وجود ندارد." />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-gray-50">
        {items.map((item) => {
          const isOpen = openId === item.id;
          return (
            <li
              key={item.id}
              className={[
                "transition-colors",
                isOpen
                  ? "bg-amber-50/40 ring-2 ring-inset ring-accent border-y border-accent/40"
                  : "",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={() => openItem(item)}
                className={[
                  "w-full flex items-start gap-3 px-5 py-4 text-start transition-colors",
                  isOpen ? "bg-amber-50/50" : "hover:bg-silver-light/60",
                ].join(" ")}
                aria-expanded={isOpen}
              >
                <span
                  className={[
                    "w-2 h-2 rounded-full shrink-0 mt-2",
                    item.isRead ? "bg-transparent" : "bg-accent",
                  ].join(" ")}
                />
                <span className="flex-1 min-w-0">
                  <span className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={[
                        "text-sm",
                        item.isRead ? "font-medium text-gray-700" : "font-bold text-charcoal",
                      ].join(" ")}
                    >
                      {item.subject}
                    </span>
                    {!item.isRead ? <Badge tone="danger">جدید</Badge> : null}
                    {isOpen ? <Badge tone="warning">در حال پاسخ</Badge> : null}
                  </span>
                  <span className="block text-xs text-gray-400 mb-1">
                    {item.userName}
                    {item.shopName ? ` · ${item.shopName}` : ""} · {item.userPhone} · {item.date}
                  </span>
                  <span className="block text-sm text-gray-600 line-clamp-2">{item.body}</span>
                </span>
              </button>

              {isOpen && open && (
                <div className="px-5 pb-5 pt-1 bg-amber-50/30 border-t border-accent/20 space-y-4">
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {thread.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4 text-center">در حال بارگذاری گفتگو…</p>
                    ) : (
                      thread.map((m) => (
                        <div
                          key={m.id}
                          className={[
                            "rounded-xl border p-3.5",
                            m.isFromPartner
                              ? "bg-white border-gray-100"
                              : "bg-amber-50/70 border-amber-100",
                          ].join(" ")}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                            <span className="text-xs font-bold text-charcoal">
                              {m.isFromPartner ? "همکار" : "پشتیبانی"}
                            </span>
                            <span className="text-[11px] text-gray-400">{m.date}</span>
                          </div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">{m.subject}</p>
                          <p className="text-sm text-charcoal leading-7 whitespace-pre-wrap">{m.body}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={submitReply} className="space-y-3">
                    <div>
                      <Label>پاسخ به کاربر</Label>
                      <Textarea
                        rows={4}
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="متن پاسخ پشتیبانی…"
                        disabled={pending}
                      />
                    </div>
                    <FormError message={error} />
                    <FormSuccess message={success} />
                    <Button type="submit" disabled={pending || !reply.trim()}>
                      {pending ? "در حال ارسال…" : "ارسال پاسخ"}
                    </Button>
                  </form>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function SuggestionsPane({ items }: { items: AdminSuggestionListItemVM[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function openItem(item: AdminSuggestionListItemVM) {
    setOpenId((prev) => (prev === item.id ? null : item.id));
    if (!item.isRead) {
      startTransition(async () => {
        await markSuggestionReadAdmin(item.id);
        router.refresh();
      });
    }
  }

  if (items.length === 0) {
    return (
      <Card>
        <EmptyState message="پیشنهادی برای نمایش وجود ندارد." />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-gray-50">
        {items.map((item) => {
          const isOpen = openId === item.id;
          return (
            <li
              key={item.id}
              className={[
                "transition-colors",
                isOpen
                  ? "bg-amber-50/40 ring-2 ring-inset ring-accent border-y border-accent/40"
                  : "",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={() => openItem(item)}
                className={[
                  "w-full flex items-start gap-3 px-5 py-4 text-start transition-colors",
                  isOpen ? "bg-amber-50/50" : "hover:bg-silver-light/60",
                ].join(" ")}
                aria-expanded={isOpen}
              >
                <span
                  className={[
                    "w-2 h-2 rounded-full shrink-0 mt-2",
                    item.isRead ? "bg-transparent" : "bg-accent",
                  ].join(" ")}
                />
                <span className="flex-1 min-w-0">
                  <span className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={[
                        "text-sm",
                        item.isRead ? "font-medium text-gray-700" : "font-bold text-charcoal",
                      ].join(" ")}
                    >
                      {item.userName}
                    </span>
                    {!item.isRead ? <Badge tone="danger">جدید</Badge> : null}
                    {isOpen ? <Badge tone="warning">انتخاب‌شده</Badge> : null}
                  </span>
                  <span className="block text-xs text-gray-400 mb-1">
                    {item.shopName ? `${item.shopName} · ` : ""}
                    {item.userPhone} · {item.date}
                  </span>
                  <span className="block text-sm text-gray-600 line-clamp-2">{item.body}</span>
                </span>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 bg-amber-50/30 border-t border-accent/20">
                  <div className="rounded-xl bg-white border border-accent/30 p-4">
                    <p className="text-sm text-charcoal leading-7 whitespace-pre-wrap">{item.body}</p>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
