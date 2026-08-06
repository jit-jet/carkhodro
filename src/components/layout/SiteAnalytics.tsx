/**
 * Injects Google Tag Manager or Google Analytics when an admin-configured ID is set.
 */

import Script from 'next/script';

function normalizeAnalyticsId(raw: string): string {
  return raw.trim();
}

function isGtmId(id: string): boolean {
  return /^GTM-[A-Z0-9]+$/i.test(id);
}

function isGaId(id: string): boolean {
  return /^(G|UA|AW|GT)-[A-Z0-9-]+$/i.test(id);
}

export default function SiteAnalytics({ analyticsId }: { analyticsId: string }) {
  const id = normalizeAnalyticsId(analyticsId);
  if (!id) return null;

  if (isGtmId(id)) {
    return (
      <>
        <Script id="gtm-script" strategy="afterInteractive">{`
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${id}');
        `}</Script>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${id}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
            title="Google Tag Manager"
          />
        </noscript>
      </>
    );
  }

  if (isGaId(id)) {
    return (
      <>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
          strategy="afterInteractive"
        />
        <Script id="ga-gtag" strategy="afterInteractive">{`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');
        `}</Script>
      </>
    );
  }

  return null;
}
