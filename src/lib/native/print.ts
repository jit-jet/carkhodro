import { Capacitor, registerPlugin } from '@capacitor/core';

interface NativePrintPlugin {
  print(options: { name?: string; html?: string; baseUrl?: string }): Promise<void>;
}

const NativePrint = registerPlugin<NativePrintPlugin>('NativePrint');

export async function printDocument(options: { html?: string; title?: string } = {}): Promise<void> {
  const title = options.title?.trim() || document.title;

  if (Capacitor.isNativePlatform()) {
    try {
      await NativePrint.print({
        name: title,
        html: options.html,
        baseUrl: window.location.origin,
      });
      return;
    } catch {
      // Keep a WebView-only fallback for development builds where native files
      // have not been synced yet. The platform projects use NativePrint.
      if (!options.html) {
        window.print();
        return;
      }
      const frame = document.createElement('iframe');
      frame.hidden = true;
      frame.srcdoc = options.html;
      document.body.appendChild(frame);
      frame.addEventListener('load', () => {
        frame.contentWindow?.print();
        window.setTimeout(() => frame.remove(), 1000);
      }, { once: true });
      return;
    }
  }

  if (options.html) {
    const popup = window.open('', '_blank');
    if (!popup) return;
    popup.document.write(options.html);
    popup.document.close();
    popup.document.title = title;
    popup.focus();
    window.setTimeout(() => popup.print(), 400);
    return;
  }

  const previousTitle = document.title;
  if (title) document.title = title;
  window.print();
  if (title) {
    window.setTimeout(() => {
      document.title = previousTitle;
    }, 1000);
  }
}
