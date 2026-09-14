package ir.carkhodro.app;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import androidx.activity.OnBackPressedCallback;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativePrintPlugin.class);
        super.onCreate(savedInstanceState);
        installStatusBarBackdrop();

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

    private void installStatusBarBackdrop() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) {
            getWindow().setStatusBarColor(Color.WHITE);
            return;
        }

        // Android 15+ keeps the system status bar transparent. Draw a native,
        // stationary background behind its icons while the WebView scrolls.
        FrameLayout content = findViewById(android.R.id.content);
        View backdrop = new View(this);
        backdrop.setBackgroundColor(Color.WHITE);
        backdrop.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
        content.addView(backdrop, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 0, Gravity.TOP
        ));

        ViewCompat.setOnApplyWindowInsetsListener(content, (view, insets) -> {
            int height = insets.isVisible(WindowInsetsCompat.Type.statusBars())
                ? insets.getInsets(WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.displayCutout()).top
                : 0;
            ViewGroup.LayoutParams params = backdrop.getLayoutParams();
            if (params.height != height) {
                params.height = height;
                backdrop.setLayoutParams(params);
            }
            return insets;
        });
        ViewCompat.requestApplyInsets(content);
    }
}
