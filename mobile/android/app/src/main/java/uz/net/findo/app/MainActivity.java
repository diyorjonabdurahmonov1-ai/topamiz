package uz.net.findo.app;

import android.webkit.CookieManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // The web view writes cookies to disk lazily, some seconds after they are
    // set. Swiped away — or killed by a phone's battery saver — right after
    // signing in, the app would lose the session cookie and sign the person
    // out. Writing them out whenever the app leaves the screen prevents that.
    @Override
    public void onPause() {
        super.onPause();
        CookieManager.getInstance().flush();
    }

    @Override
    public void onStop() {
        super.onStop();
        CookieManager.getInstance().flush();
    }
}
