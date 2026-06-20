'use client';

/**
 * Support messaging panel.
 * ────────────────────────
 * Folders (Inbox / Sent / Deleted) + a new-message composer + read/delete/
 * restore. The server actions revalidate, but we also re-read `getSupportInbox`
 * after each mutation to refresh the local view without a full navigation.
 */

import { useState, useTransition } from 'react';
import {
  getSupportInbox,
  sendSupportMessage,
  markMessageRead,
  setMessageDeleted,
} from '@/actions/support';
import type {
  SupportInboxVM,
  SupportMessageVM,
  MessageFolder,
} from '@/src/lib/dashboard-types';

const FOLDERS: { key: MessageFolder; label: string }[] = [
  { key: 'inbox', label: 'صندوق پیام' },
  { key: 'sent', label: 'ارسال شده' },
  { key: 'deleted', label: 'حذف شده' },
];

export default function SupportPanel({ initial }: { initial: SupportInboxVM }) {
  const [data, setData] = useState<SupportInboxVM>(initial);
  const [folder, setFolder] = useState<MessageFolder>('inbox');
  const [composing, setComposing] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const messages = data[folder];

  function refresh() {
    startTransition(async () => {
      setData(await getSupportInbox());
    });
  }

  function openMessage(message: SupportMessageVM) {
    setOpenId((prev) => (prev === message.id ? null : message.id));
    if (!message.isRead && message.direction === 'INBOUND') {
      startTransition(async () => {
        await markMessageRead(message.id);
        setData(await getSupportInbox());
      });
    }
  }

  function remove(id: string) {
    startTransition(async () => {
      await setMessageDeleted(id, true);
      setData(await getSupportInbox());
    });
  }

  function restore(id: string) {
    startTransition(async () => {
      await setMessageDeleted(id, false);
      setData(await getSupportInbox());
    });
  }

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-4 items-start">
      {/* Folder rail */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 order-2 lg:order-1">
        <button
          onClick={() => {
            setComposing(true);
            setOpenId(null);
          }}
          className="w-full mb-3 bg-accent hover:bg-accent-dark text-charcoal font-bold text-sm py-3 rounded-xl transition-colors"
        >
          + پیام جدید
        </button>
        <ul className="space-y-1">
          {FOLDERS.map((f) => {
            const active = folder === f.key && !composing;
            const badge = f.key === 'inbox' ? data.unreadCount : 0;
            return (
              <li key={f.key}>
                <button
                  onClick={() => {
                    setFolder(f.key);
                    setComposing(false);
                    setOpenId(null);
                  }}
                  className={[
                    'w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                    active ? 'bg-amber-50 text-accent-dark' : 'text-charcoal hover:bg-silver-light',
                  ].join(' ')}
                >
                  <span>{f.label}</span>
                  {badge > 0 && (
                    <span className="min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                      {badge.toLocaleString('fa-IR')}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Message area */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm min-h-[24rem] order-1 lg:order-2">
        {composing ? (
          <Composer
            pending={pending}
            onClose={() => setComposing(false)}
            onSent={() => {
              setComposing(false);
              setFolder('sent');
              refresh();
            }}
          />
        ) : messages.length === 0 ? (
          <EmptyFolder />
        ) : (
          <ul className="divide-y divide-gray-50">
            {messages.map((m) => (
              <MessageRow
                key={m.id}
                message={m}
                open={openId === m.id}
                folder={folder}
                onToggle={() => openMessage(m)}
                onDelete={() => remove(m.id)}
                onRestore={() => restore(m.id)}
                disabled={pending}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function MessageRow({
  message,
  open,
  folder,
  onToggle,
  onDelete,
  onRestore,
  disabled,
}: {
  message: SupportMessageVM;
  open: boolean;
  folder: MessageFolder;
  onToggle: () => void;
  onDelete: () => void;
  onRestore: () => void;
  disabled: boolean;
}) {
  const unread = message.direction === 'INBOUND' && !message.isRead && !message.isDeleted;
  return (
    <li>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-start hover:bg-silver-light/60 transition-colors"
      >
        <span
          className={[
            'w-2 h-2 rounded-full shrink-0',
            unread ? 'bg-accent' : 'bg-transparent',
          ].join(' ')}
        />
        <span className="flex-1 min-w-0">
          <span className={['block truncate text-sm', unread ? 'font-bold text-charcoal' : 'font-medium text-gray-600'].join(' ')}>
            {message.subject}
          </span>
          <span className="block text-xs text-gray-400 mt-0.5 truncate">{message.body}</span>
        </span>
        <span className="text-[11px] text-gray-400 shrink-0">{message.date}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 -mt-1">
          <div className="bg-silver-light rounded-xl p-4 text-sm text-gray-700 leading-7 whitespace-pre-line">
            {message.body}
          </div>
          <div className="flex items-center gap-2 mt-3">
            {folder === 'deleted' ? (
              <button
                onClick={onRestore}
                disabled={disabled}
                className="text-xs font-semibold text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                بازیابی پیام
              </button>
            ) : (
              <button
                onClick={onDelete}
                disabled={disabled}
                className="text-xs font-semibold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                حذف پیام
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

function Composer({
  pending,
  onClose,
  onSent,
}: {
  pending: boolean;
  onClose: () => void;
  onSent: () => void;
}) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [, startSend] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!subject.trim()) return setError('موضوع پیام را وارد کنید.');
    if (!body.trim()) return setError('متن پیام را وارد کنید.');
    startSend(async () => {
      const result = await sendSupportMessage({ subject, body });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSent();
    });
  }

  return (
    <form onSubmit={submit} className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-charcoal">ارسال پیام جدید</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">
          انصراف
        </button>
      </div>

      {error && (
        <p className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-4 py-3">{error}</p>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">موضوع</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="موضوع پیام…"
          className="w-full border-2 border-silver focus:border-accent rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">متن پیام</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          placeholder="پیام خود را بنویسید…"
          className="w-full border-2 border-silver focus:border-accent rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none leading-7"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="bg-accent hover:bg-accent-dark text-charcoal font-bold text-sm px-6 py-3 rounded-xl transition-colors disabled:opacity-60"
      >
        {pending ? 'در حال ارسال…' : 'ارسال پیام'}
      </button>
    </form>
  );
}

function EmptyFolder() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 text-gray-400">
      <svg className="w-12 h-12 mb-3 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
      <p className="text-sm">پیامی برای نمایش وجود ندارد.</p>
    </div>
  );
}
