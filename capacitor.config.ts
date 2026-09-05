import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';
import 'dotenv/config';

const rawServerUrl = process.env.CAPACITOR_SERVER_URL?.trim();
const serverUrl = rawServerUrl ? new URL(rawServerUrl) : null;
const extraNavigationHosts = (process.env.CAPACITOR_ALLOWED_NAVIGATION ?? '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);

const config: CapacitorConfig = {
  appId: 'ir.carkhodro.app',
  appName: 'کارخودرو',
  // The local files are an offline/configuration fallback. The real application
  // remains server-rendered and is loaded from CAPACITOR_SERVER_URL.
  webDir: 'native-shell',
  backgroundColor: '#ffffff',
  loggingBehavior: 'debug',
  appendUserAgent: ' CarkhodroCapacitor/1',
  ios: {
    contentInset: 'never',
    preferredContentMode: 'mobile',
    allowsLinkPreview: false,
  },
  android: {
    allowMixedContent: false,
    captureInput: false,
  },
  server: serverUrl
    ? {
        url: serverUrl.toString().replace(/\/$/, ''),
        cleartext: serverUrl.protocol === 'http:',
        // The payment flow must stay in this WebView so its callback has the
        // same authenticated cookie jar. Other external URLs open separately.
        allowNavigation: [
          serverUrl.hostname,
          'gateway.zibal.ir',
          ...extraNavigationHosts,
        ],
        errorPath: 'error.html',
      }
    : {
        errorPath: 'error.html',
      },
  plugins: {
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
      autoBackdropColor: 'dom',
    },
    SystemBars: {
      insetsHandling: 'css',
      style: 'LIGHT',
      hidden: false,
      animation: 'NONE',
    },
  },
};

export default config;
