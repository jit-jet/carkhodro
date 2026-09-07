package ir.carkhodro.app;

import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativePrintPlugin.class);
        super.onCreate(savedInstanceState);

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                String currentUrl = getBridge().getWebView().getUrl();
                String connectionErrorUrl = getBridge().getErrorUrl();

                if (connectionErrorUrl != null && connectionErrorUrl.equals(currentUrl)) {
                    finish();
                    return;
                }

                // Let Capacitor keep handling history and the website's own Back listener.
                setEnabled(false);
                getOnBackPressedDispatcher().onBackPressed();
                setEnabled(true);
            }
        });
    }
}
