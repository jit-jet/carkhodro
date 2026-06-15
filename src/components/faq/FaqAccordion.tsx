'use client';

import { useState } from 'react';
import type { FaqVM } from '@/src/lib/serializers';

export default function FaqAccordion({ faqs }: { faqs: FaqVM[] }) {
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {faqs.map((faq) => {
        const isOpen = openId === faq.id;
        const panelId = `faq-panel-${faq.id}`;
        const btnId = `faq-btn-${faq.id}`;

        return (
          <div key={faq.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <h3>
              <button
                id={btnId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                className="w-full flex items-center justify-between px-6 py-4 text-right font-semibold text-charcoal hover:text-accent-dark transition-colors"
              >
                <span>{faq.question}</span>
                <svg
                  aria-hidden="true"
                  className={`w-5 h-5 text-accent flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              hidden={!isOpen}
              className="px-6 pb-5 text-sm text-gray-600 leading-8 border-t border-gray-100 pt-4"
            >
              {faq.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
