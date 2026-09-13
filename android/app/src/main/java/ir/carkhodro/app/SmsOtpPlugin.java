package ir.carkhodro.app;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import androidx.activity.result.ActivityResult;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.phone.SmsRetriever;
import com.google.android.gms.common.api.CommonStatusCodes;
import com.google.android.gms.common.api.Status;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Reads one OTP SMS after the user approves Android's one-message consent prompt. */
@CapacitorPlugin(name = "SmsOtp")
public class SmsOtpPlugin extends Plugin {
    private static final Pattern CODE_PATTERN = Pattern.compile("(?<!\\p{Nd})\\p{Nd}{4}(?!\\p{Nd})");
    private BroadcastReceiver receiver;
    private PluginCall activeCall;
    private boolean listening;

    @PluginMethod
    public void start(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            stopInternal();
            activeCall = call;
            listening = true;
            receiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    if (!listening || !SmsRetriever.SMS_RETRIEVED_ACTION.equals(intent.getAction())) return;
                    Bundle extras = intent.getExtras();
                    if (extras == null) return;
                    Status status = extras.getParcelable(SmsRetriever.EXTRA_STATUS);
                    if (status == null) return;

                    if (status.getStatusCode() == CommonStatusCodes.SUCCESS) {
                        Intent consentIntent = extras.getParcelable(SmsRetriever.EXTRA_CONSENT_INTENT);
                        unregisterReceiver();
                        if (consentIntent != null && activeCall != null) {
                            try {
                                startActivityForResult(activeCall, consentIntent, "onConsentResult");
                            } catch (Exception error) {
                                stopInternal();
                            }
                        } else {
                            stopInternal();
                        }
                    } else if (status.getStatusCode() == CommonStatusCodes.TIMEOUT) {
                        stopInternal();
                    }
                }
            };

            try {
                ContextCompat.registerReceiver(
                    getContext(), receiver, new IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION),
                    SmsRetriever.SEND_PERMISSION, null, ContextCompat.RECEIVER_EXPORTED
                );
                SmsRetriever.getClient(getContext()).startSmsUserConsent(null)
                    .addOnSuccessListener(ignored -> call.resolve())
                    .addOnFailureListener(error -> {
                        stopInternal();
                        call.reject("SMS consent is unavailable", error);
                    });
            } catch (Exception error) {
                stopInternal();
                call.reject("SMS consent is unavailable", error);
            }
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            stopInternal();
            call.resolve();
        });
    }

    @ActivityCallback
    private void onConsentResult(PluginCall call, ActivityResult result) {
        if (listening && result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
            String message = result.getData().getStringExtra(SmsRetriever.EXTRA_SMS_MESSAGE);
            String code = extractCode(message);
            if (code != null) {
                JSObject data = new JSObject();
                data.put("code", code);
                notifyListeners("codeReceived", data);
            }
        }
        stopInternal();
        if (call != null) getBridge().releaseCall(call);
    }

    private static String extractCode(String message) {
        if (message == null || !message.contains("کارخودرو")) return null;
        Matcher matcher = CODE_PATTERN.matcher(message);
        if (!matcher.find()) return null;
        String found = matcher.group();
        StringBuilder ascii = new StringBuilder(4);
        for (int i = 0; i < found.length(); i++) {
            int digit = Character.digit(found.charAt(i), 10);
            if (digit < 0) return null;
            ascii.append(digit);
        }
        return ascii.toString();
    }

    private void unregisterReceiver() {
        if (receiver == null) return;
        try {
            getContext().unregisterReceiver(receiver);
        } catch (IllegalArgumentException ignored) {
            // A previous listener may already have been removed.
        }
        receiver = null;
    }

    private void stopInternal() {
        listening = false;
        unregisterReceiver();
        activeCall = null;
    }

    @Override
    protected void handleOnDestroy() {
        stopInternal();
    }
}
