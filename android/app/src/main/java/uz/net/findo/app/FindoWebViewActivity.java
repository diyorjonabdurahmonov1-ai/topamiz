package uz.net.findo.app;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.text.TextUtils;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import androidx.core.content.FileProvider;

import java.io.File;
import java.util.Locale;

/**
 * Findo in the app's own full-screen web view, for phones where no browser
 * can run a Trusted Web Activity (no Chrome: Huawei, some Xiaomi and other
 * phones whose only browser can't). Without it those phones opened the site
 * in a browser tab with an address bar. See LauncherActivity.getFallbackStrategy.
 *
 * The library's own WebViewFallbackActivity can't pick files or ask for the
 * location, and posting a listing needs both: this one can.
 *
 * The user agent gets " FindoApp/Android" so the site knows it's in the app
 * (src/lib/native-app.ts) and hides Google sign-in, which Google refuses in
 * app web views. Web push doesn't exist in a web view, so the notification
 * toggle explains that instead.
 */
public class FindoWebViewActivity extends Activity {
    private static final String EXTRA_URL = "uz.net.findo.app.URL";
    private static final String HOST = "findo.net.uz";
    private static final String HOME = "https://" + HOST + "/";
    private static final int BACKGROUND = Color.parseColor("#05060A");
    private static final int REQUEST_FILES = 1;
    private static final int REQUEST_LOCATION = 2;

    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private Uri cameraOutput;
    private GeolocationPermissions.Callback geolocationCallback;
    private String geolocationOrigin;

    static Intent createLaunchIntent(Context context, Uri url) {
        Intent intent = new Intent(context, FindoWebViewActivity.class);
        intent.putExtra(EXTRA_URL, url != null ? url.toString() : HOME);
        return intent;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(BACKGROUND);
        getWindow().setNavigationBarColor(BACKGROUND);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(BACKGROUND);
        webView = new WebView(this);
        root.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);
        // Android 15+ draws apps edge to edge: keep the page clear of the
        // status bar, the navigation bar and the keyboard.
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                android.graphics.Insets bars = insets.getInsets(
                        WindowInsets.Type.systemBars() | WindowInsets.Type.ime());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            } else {
                view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                        insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            }
            return insets;
        });

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setUserAgentString(settings.getUserAgentString() + " FindoApp/Android");
        CookieManager.getInstance().setAcceptCookie(true);

        webView.setWebViewClient(new FindoClient());
        webView.setWebChromeClient(new FindoChromeClient());

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            String url = getIntent().getStringExtra(EXTRA_URL);
            webView.loadUrl(isOurs(url != null ? Uri.parse(url) : null) ? url : HOME);
        }
    }

    private static boolean isOurs(Uri uri) {
        if (uri == null || !"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null) return false;
        String host = uri.getHost().toLowerCase(Locale.ROOT);
        return host.equals(HOST) || host.endsWith("." + HOST);
    }

    private class FindoClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (isOurs(uri)) return false;
            // Phone numbers (tel:), maps, other sites: the phone's own apps.
            try {
                Intent intent = "intent".equalsIgnoreCase(uri.getScheme())
                        ? Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME)
                        : new Intent(Intent.ACTION_VIEW, uri);
                intent.addCategory(Intent.CATEGORY_BROWSABLE);
                intent.setComponent(null);
                intent.setSelector(null);
                startActivity(intent);
            } catch (Exception ignored) {
                // Nothing on the phone opens it: stay where we are.
            }
            return true;
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request.isForMainFrame()) view.loadDataWithBaseURL(HOME, OFFLINE_PAGE, "text/html", "utf-8", null);
        }

        // The page's renderer was killed (low memory): start it again rather
        // than crash the app.
        @Override
        public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
            recreate();
            return true;
        }
    }

    private class FindoChromeClient extends WebChromeClient {
        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
            if (fileCallback != null) fileCallback.onReceiveValue(null);
            fileCallback = callback;
            cameraOutput = null;

            String accept = TextUtils.join(",", params.getAcceptTypes()).toLowerCase(Locale.ROOT);
            Intent intent;
            if (params.isCaptureEnabled()) {
                // "Take a photo" / "Record a video" on the post form.
                if (accept.contains("video")) {
                    intent = new Intent(MediaStore.ACTION_VIDEO_CAPTURE);
                } else {
                    intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                    cameraOutput = newCameraFile();
                    if (cameraOutput != null) {
                        intent.putExtra(MediaStore.EXTRA_OUTPUT, cameraOutput);
                        intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    }
                }
            } else {
                intent = params.createIntent();
                if (params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) {
                    intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                }
            }
            try {
                startActivityForResult(intent, REQUEST_FILES);
                return true;
            } catch (ActivityNotFoundException e) {
                fileCallback = null;
                return false;
            }
        }

        @Override
        public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
            if (!isOurs(Uri.parse(origin))) {
                callback.invoke(origin, false, false);
                return;
            }
            if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                callback.invoke(origin, true, false);
                return;
            }
            geolocationOrigin = origin;
            geolocationCallback = callback;
            requestPermissions(new String[] {
                    Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION
            }, REQUEST_LOCATION);
        }

        // Full-screen video.
        private View fullScreenView;

        @Override
        public void onShowCustomView(View view, CustomViewCallback callback) {
            if (fullScreenView != null) onHideCustomView();
            fullScreenView = view;
            ((ViewGroup) webView.getParent()).addView(view, new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        }

        @Override
        public void onHideCustomView() {
            if (fullScreenView == null) return;
            ((ViewGroup) fullScreenView.getParent()).removeView(fullScreenView);
            fullScreenView = null;
        }
    }

    private Uri newCameraFile() {
        try {
            File dir = new File(getCacheDir(), "camera");
            if (!dir.exists() && !dir.mkdirs()) return null;
            File file = File.createTempFile("photo-", ".jpg", dir);
            return FileProvider.getUriForFile(this, getString(R.string.providerAuthority), file);
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode != REQUEST_FILES || fileCallback == null) {
            super.onActivityResult(requestCode, resultCode, data);
            return;
        }
        Uri[] result = null;
        if (resultCode == RESULT_OK) {
            ClipData clip = data != null ? data.getClipData() : null;
            if (clip != null && clip.getItemCount() > 0) {
                result = new Uri[clip.getItemCount()];
                for (int i = 0; i < clip.getItemCount(); i++) result[i] = clip.getItemAt(i).getUri();
            } else if (data != null && data.getData() != null) {
                result = new Uri[] {data.getData()};
            } else if (cameraOutput != null) {
                result = new Uri[] {cameraOutput};
            }
        }
        fileCallback.onReceiveValue(result);
        fileCallback = null;
        cameraOutput = null;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode == REQUEST_LOCATION && geolocationCallback != null) {
            boolean granted = false;
            for (int result : grantResults) granted |= result == PackageManager.PERMISSION_GRANTED;
            geolocationCallback.invoke(geolocationOrigin, granted, false);
            geolocationCallback = null;
            geolocationOrigin = null;
            return;
        }
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
    }

    @Override
    protected void onPause() {
        webView.onPause();
        CookieManager.getInstance().flush();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        webView.destroy();
        super.onDestroy();
    }

    private static final String OFFLINE_PAGE = "<!doctype html><html lang=\"uz\"><head><meta charset=\"utf-8\">"
            + "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
            + "<style>html,body{height:100%;margin:0}body{display:flex;align-items:center;justify-content:center;"
            + "text-align:center;background:#05060a;color:#eef0f8;font:15px/1.5 sans-serif;padding:0 24px}"
            + "p{color:#9aa0b8;margin:4px 0}button{margin-top:22px;border:0;border-radius:14px;padding:13px 28px;"
            + "font:600 15px sans-serif;color:#fff;background:linear-gradient(90deg,#6366f1,#7c3aed)}</style></head>"
            + "<body><main><h1 style=\"font-size:20px\">Internet yo'q</h1><p>Findo'ni ochish uchun internetga ulaning.</p>"
            + "<p lang=\"ru\">Нет подключения к интернету.</p>"
            + "<button onclick=\"location.href='" + HOME + "'\">Qayta urinish</button></main></body></html>";
}
