package app.nurhayat.islam;

import android.os.Bundle;
import android.webkit.WebSettings;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Edge-to-edge: даём системе не "поджимать" контент под жестовую навигацию,
        // а рисовать под системными барами самим — WebView уже отдаёт настоящие
        // отступы через env(safe-area-inset-*), которые CSS приложения использует
        // повсеместно (--safe-top/--safe-bottom в styles/index.css).
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        super.onCreate(savedInstanceState);
        // Приложение само грузится по виртуальному https://localhost (Capacitor),
        // а тестовое видео пока идёт с http-сервера на компьютере — без этого
        // WebView молча блокирует его как "смешанный контент".
        this.bridge.getWebView().getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        hideNavigationBar();
    }

    // Immersive sticky: прячем кнопочную навигационную панель, свайп снизу
    // временно её показывает (сама исчезает через пару секунд) — статус-бар
    // сверху не трогаем, он должен быть виден всегда.
    // Вызываем не только из onCreate: система сбрасывает флаги скрытия при
    // каждом получении окном фокуса (возврат из фона, закрытие диалога и
    // т.п.), поэтому без onWindowFocusChanged панель вернётся сама.
    private void hideNavigationBar() {
        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        controller.hide(WindowInsetsCompat.Type.navigationBars());
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideNavigationBar();
    }
}
