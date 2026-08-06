package app.nurhayat.islam;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Приложение само грузится по виртуальному https://localhost (Capacitor),
        // а тестовое видео пока идёт с http-сервера на компьютере — без этого
        // WebView молча блокирует его как "смешанный контент".
        this.bridge.getWebView().getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
    }
}
