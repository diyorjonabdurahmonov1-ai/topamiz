package uz.net.findo.app;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.webkit.CookieManager;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;
import java.util.concurrent.atomic.AtomicBoolean;

public class MainActivity extends BridgeActivity {
    // Away from the screen for at least this long, the web view is checked on
    // return (shorter trips never freeze it).
    private static final long CHECK_AFTER_AWAY_MS = 20_000;
    // A live page answers a script within milliseconds; none in this time
    // means it is stuck.
    private static final long ANSWER_WITHIN_MS = 5_000;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private long pausedAt = 0;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // After a long time in the background Android can take the web view's
        // renderer process away to free memory. Capacitor's default then lets
        // the app die or leaves a dead white/frozen page; instead, rebuild the
        // screen, which loads the site again.
        if (getBridge() != null) {
            getBridge().addWebViewListener(new WebViewListener() {
                @Override
                public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                    runOnUiThread(() -> recreate());
                    return true;
                }
            });
        }
    }

    // The web view writes cookies to disk lazily, some seconds after they are
    // set. Swiped away — or killed by a phone's battery saver — right after
    // signing in, the app would lose the session cookie and sign the person
    // out. Writing them out whenever the app leaves the screen prevents that.
    @Override
    public void onPause() {
        super.onPause();
        pausedAt = SystemClock.elapsedRealtime();
        CookieManager.getInstance().flush();
    }

    @Override
    public void onStop() {
        super.onStop();
        CookieManager.getInstance().flush();
    }

    // Coming back from another app, the page sometimes opens but is frozen:
    // buttons do nothing. Make sure the web view's timers run, tell the page
    // it is back, and if it does not even answer a script, reload it.
    @Override
    public void onResume() {
        super.onResume();
        if (getBridge() == null || getBridge().getWebView() == null) return;
        final WebView web = getBridge().getWebView();
        web.onResume();
        web.resumeTimers();

        long away = pausedAt == 0 ? 0 : SystemClock.elapsedRealtime() - pausedAt;
        if (away < CHECK_AFTER_AWAY_MS) return;

        final AtomicBoolean answered = new AtomicBoolean(false);
        web.evaluateJavascript(
            "window.dispatchEvent(new Event('findo-native-resume')); 1",
            value -> answered.set(true)
        );
        handler.postDelayed(
            () -> {
                if (!answered.get() && !isFinishing() && !isDestroyed()) {
                    web.reload();
                }
            },
            ANSWER_WITHIN_MS
        );
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        super.onDestroy();
    }
}
