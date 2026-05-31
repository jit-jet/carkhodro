'use client';

import { useState } from 'react';
import type { PDPComment } from '@/src/data/pdpMockData';

interface Props {
  description: string;
  comments: PDPComment[];
  productId: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function StarRow({
  rating,
  size = 'sm',
}: {
  rating: number;
  size?: 'sm' | 'md';
}) {
  const px = size === 'sm' ? 16 : 20;
  return (
    <span className="flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={px} height={px} viewBox="0 0 24 24">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={i <= rating ? '#F4C232' : '#E5E7EB'}
            stroke={i <= rating ? '#D89B1F' : '#D1D5DB'}
            strokeWidth="0.5"
          />
        </svg>
      ))}
    </span>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  return (
    <span className="flex items-center gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`امتیاز ${i}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={i <= display ? '#F4C232' : '#E5E7EB'}
              stroke={i <= display ? '#D89B1F' : '#D1D5DB'}
              strokeWidth="0.5"
              className="transition-colors duration-100"
            />
          </svg>
        </button>
      ))}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProductComments({ description, comments: initial, productId: _productId }: Props) {
  const [activeTab, setActiveTab] = useState<'description' | 'comments'>('description');
  const [comments,  setComments]  = useState<PDPComment[]>(initial);
  const [formOpen,  setFormOpen]  = useState(false);

  // form state
  const [name,    setName]    = useState('');
  const [rating,  setRating]  = useState(0);
  const [text,    setText]    = useState('');
  const [errors,  setErrors]  = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: string[] = [];
    if (!name.trim())  errs.push('نام خود را وارد کنید.');
    if (rating === 0)  errs.push('لطفاً امتیاز خود را انتخاب کنید.');
    if (!text.trim())  errs.push('متن نظر را وارد کنید.');
    if (errs.length) { setErrors(errs); return; }

    const now = new Date().toLocaleDateString('fa-IR');
    setComments(prev => [
      {
        id: Date.now(),
        author: name.trim(),
        date: now,
        rating,
        text: text.trim(),
        verified: false,
      },
      ...prev,
    ]);
    setName(''); setRating(0); setText('');
    setErrors([]);
    setSuccess(true);
    setFormOpen(false);
    setTimeout(() => setSuccess(false), 4000);
  }

  const avgRating =
    comments.length > 0
      ? comments.reduce((s, c) => s + c.rating, 0) / comments.length
      : 0;

  return (
    <div>
      {/* ── Tabs ───────────────────────────────────────────────── */}
      <div className="flex border-b border-gray-100">
        {(
          [
            { key: 'description', label: 'توضیحات محصول' },
            { key: 'comments',    label: `نظرات (${comments.length.toLocaleString('fa-IR')})` },
          ] as const
        ).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={[
              'px-6 py-4 text-sm font-semibold transition-colors relative',
              activeTab === tab.key
                ? 'text-charcoal after:absolute after:bottom-0 after:inset-x-0 after:h-0.5 after:bg-accent'
                : 'text-gray-400 hover:text-gray-600',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Description pane ───────────────────────────────────── */}
      {activeTab === 'description' && (
        <div className="p-6 lg:p-8">
          <h2 className="text-base font-bold text-charcoal mb-4">توضیحات کامل محصول</h2>
          <p className="text-sm text-gray-600 leading-8 whitespace-pre-line">{description}</p>
        </div>
      )}

      {/* ── Comments pane ──────────────────────────────────────── */}
      {activeTab === 'comments' && (
        <div className="p-6 lg:p-8 space-y-6">
          {/* Summary row */}
          {comments.length > 0 && (
            <div className="flex items-center gap-4 bg-silver-light rounded-xl px-5 py-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-charcoal leading-none">{avgRating.toFixed(1)}</p>
                <StarRow rating={Math.round(avgRating)} size="sm" />
                <p className="text-xs text-gray-400 mt-0.5">{comments.length.toLocaleString('fa-IR')} نظر</p>
              </div>
              <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = comments.filter(c => c.rating === star).length;
                  const pct   = comments.length > 0 ? (count / comments.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="w-3 text-left">{star}</span>
                      <svg className="w-3 h-3 text-accent shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Success toast */}
          {success && (
            <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm font-semibold px-4 py-3 rounded-xl border border-green-200">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              نظر شما با موفقیت ثبت شد.
            </div>
          )}

          {/* Add comment toggle */}
          {!formOpen && (
            <button
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-2 bg-accent hover:bg-accent-dark active:scale-95 text-charcoal font-semibold text-sm px-5 py-2.5 rounded-xl transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              ثبت نظر جدید
            </button>
          )}

          {/* Comment form */}
          {formOpen && (
            <form
              onSubmit={handleSubmit}
              className="bg-silver-light rounded-2xl p-5 space-y-4 border border-gray-200"
            >
              <h3 className="font-bold text-charcoal">ثبت نظر</h3>

              {errors.length > 0 && (
                <ul className="bg-red-50 text-red-600 text-xs rounded-xl px-4 py-3 space-y-1 border border-red-200">
                  {errors.map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">نام شما</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="مثال: علی احمدی"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">امتیاز شما</label>
                  <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 inline-flex">
                    <StarPicker value={rating} onChange={setRating} />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">متن نظر</label>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  rows={4}
                  placeholder="تجربه خود را با دیگران به اشتراک بگذارید..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-accent transition-colors resize-none leading-7"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-accent hover:bg-accent-dark active:scale-95 text-charcoal font-bold text-sm py-3 rounded-xl transition-all"
                >
                  ثبت نظر
                </button>
                <button
                  type="button"
                  onClick={() => { setFormOpen(false); setErrors([]); }}
                  className="px-5 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  انصراف
                </button>
              </div>
            </form>
          )}

          {/* Comment list */}
          {comments.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <p className="text-sm">هنوز نظری ثبت نشده. اولین نفر باشید!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar initial */}
                      <div className="w-9 h-9 rounded-full bg-accent/20 text-accent-dark font-bold text-sm flex items-center justify-center shrink-0">
                        {comment.author.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-charcoal">{comment.author}</span>
                          {comment.verified && (
                            <span className="flex items-center gap-1 bg-blue-50 text-blue-600 text-[10px] font-medium px-2 py-0.5 rounded-full">
                              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                              خریدار تأیید شده
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{comment.date}</p>
                      </div>
                    </div>
                    <StarRow rating={comment.rating} size="sm" />
                  </div>
                  <p className="text-sm text-gray-700 leading-7">{comment.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
