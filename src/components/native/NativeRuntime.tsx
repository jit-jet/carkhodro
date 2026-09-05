'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { App } from '@capacitor/app';
import { AppLauncher } from '@capacitor/app-launcher';
import { Browser } from '@capacitor/browser';
import { Keyboard } from '@capacitor/keyboard';

const NATIVE_WEBVIEW_HOSTS = new Set(['gateway.zibal.ir']);

function internalPathFromUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const isHttp = url.protocol === 'http:' || url.protocol === 'https:';
    const isCustomScheme = url.protocol === 'carkhodro:' || url.protocol === 'ir.carkhodro.app:';
    if (!isCustomScheme && (!isHttp || url.origin !== window.location.origin)) return null;

    if (isCustomScheme) {
      const customPath = `/${[url.hostname, url.pathname.replace(/^\//, '')].filter(Boolean).join('/')}`;
      return `${customPath}${url.search}${url.hash}`;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export default function NativeRuntime() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const root = document.documentElement;
    root.classList.add('capacitor-native', `capacitor-${Capacitor.getPlatform()}`);
    const handles: PluginListenerHandle[] = [];
    let disposed = false;

    const routeDeepLink = (rawUrl: string) => {
      const path = internalPathFromUrl(rawUrl);
      if (!path) return;
      void Browser.close().catch(() => undefined);
      router.push(path);
      router.refresh();
    };

    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>('a[href]');
      if (!anchor) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (['tel:', 'mailto:', 'sms:'].includes(url.protocol)) {
        event.preventDefault();
        void AppLauncher.openUrl({ url: url.toString() }).catch(() => {
          window.location.href = url.toString();
        });
        return;
      }

      if (!['http:', 'https:'].includes(url.protocol)) return;
      const isSameOrigin = url.origin === window.location.origin;
      if (isSameOrigin && anchor.target === '_blank') {
        event.preventDefault();
        router.push(`${url.pathname}${url.search}${url.hash}`);
        return;
      }

      if (!isSameOrigin && !NATIVE_WEBVIEW_HOSTS.has(url.hostname)) {
        event.preventDefault();
        void Browser.open({
          url: url.toString(),
          toolbarColor: '#4A4A4A',
          presentationStyle: 'fullscreen',
        }).catch(() => AppLauncher.openUrl({ url: url.toString() }));
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.matches('input, textarea, select, [contenteditable="true"]')) return;
      window.setTimeout(() => target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250);
    };

    document.addEventListener('click', onDocumentClick, true);
    document.addEventListener('focusin', onFocusIn);

    void Promise.all([
      App.addListener('appUrlOpen', ({ url }) => routeDeepLink(url)),
      App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) window.history.back();
        else void App.minimizeApp();
      }),
      Keyboard.addListener('keyboardWillShow', ({ keyboardHeight }) => {
        root.classList.add('capacitor-keyboard-open');
        root.style.setProperty('--app-keyboard-height', `${keyboardHeight}px`);
      }),
      Keyboard.addListener('keyboardWillHide', () => {
        root.classList.remove('capacitor-keyboard-open');
        root.style.removeProperty('--app-keyboard-height');
      }),
    ]).then((registered) => {
      if (disposed) registered.forEach((handle) => void handle.remove());
      else handles.push(...registered);
    });

    void App.getLaunchUrl().then((launch) => {
      if (launch?.url) routeDeepLink(launch.url);
    });

    return () => {
      disposed = true;
      document.removeEventListener('click', onDocumentClick, true);
      document.removeEventListener('focusin', onFocusIn);
      root.classList.remove('capacitor-native', 'capacitor-android', 'capacitor-ios', 'capacitor-keyboard-open');
      root.style.removeProperty('--app-keyboard-height');
      handles.forEach((handle) => void handle.remove());
    };
  }, [router]);

  return null;
}
