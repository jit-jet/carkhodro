package ir.carkhodro.app;

import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Permission-free bridge to the Android system print/PDF sheet. */
@CapacitorPlugin(name = "NativePrint")
public class NativePrintPlugin extends Plugin {
    // Keep the temporary WebView alive until Android has created its adapter.
    private WebView printWebView;

    @PluginMethod
    public void print(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            String name = call.getString("name", "کارخودرو");
            String html = call.getString("html");

            if (html == null || html.isEmpty()) {
                startPrint(getBridge().getWebView(), name);
                call.resolve();
                return;
            }

            WebView webView = new WebView(getContext());
            printWebView = webView;
            webView.getSettings().setJavaScriptEnabled(false);
            webView.setWebViewClient(new WebViewClient() {
                private boolean printed = false;

                @Override
                public void onPageFinished(WebView view, String url) {
                    if (printed) return;
                    printed = true;
                    startPrint(view, name);
                    call.resolve();
                }
            });
            String baseUrl = call.getString("baseUrl", "https://localhost");
            webView.loadDataWithBaseURL(baseUrl, html, "text/html", "UTF-8", null);
        });
    }

    private void startPrint(WebView webView, String jobName) {
        PrintManager manager = (PrintManager) getContext().getSystemService(Context.PRINT_SERVICE);
        PrintDocumentAdapter adapter = webView.createPrintDocumentAdapter(jobName);
        manager.print(jobName, adapter, new PrintAttributes.Builder()
            .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
            .setColorMode(PrintAttributes.COLOR_MODE_COLOR)
            .build());
    }
}
