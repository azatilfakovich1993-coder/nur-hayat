package app.nurhayat.islam;

import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebSettings;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Мост для согласования системных баров с темой приложения (см. SystemBarsPlugin).
        registerPlugin(SystemBarsPlugin.class);
        // Открытие системных настроек приложения — нужно, когда отказано в
        // доступе к местоположению и запросить его заново нечем.
        registerPlugin(DeviceSettingsPlugin.class);
        // Edge-to-edge: даём системе не "поджимать" контент под системные бары,
        // а рисовать под ними самим — WebView отдаёт настоящие отступы через
        // env(safe-area-inset-*), которые CSS приложения использует повсеместно
        // (--safe-top/--safe-bottom в styles/index.css). Нижняя панель вкладок
        // за счёт этого сама встаёт над кнопками навигации.
        //
        // Навигационную панель Android СПЕЦИАЛЬНО не прячем. Раньше здесь стоял
        // иммерсивный режим: панель скрывалась, safe-area-inset-bottom
        // становился нулевым, вкладки уезжали к самому низу экрана. А когда
        // пользователь вызывал системные кнопки свайпом, они рисовались ПОВЕРХ
        // содержимого (так работают "временные" панели) и закрывали собой
        // вкладки "Главная / Коран / Намаз / Чат / Профиль". На устройстве с
        // тремя кнопками навигации это особенно мешало.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        super.onCreate(savedInstanceState);

        // Приложение грузится по виртуальному https://localhost (Capacitor), а
        // тестовое видео при отладке идёт с http-сервера на компьютере — без
        // этого WebView молча блокирует его как "смешанный контент".
        //
        // ТОЛЬКО для отладки. Раньше это стояло без условия и попадало в релиз:
        // WebView у всех пользователей соглашался подгружать содержимое по
        // незашифрованному http, то есть в чужой сети его можно было подменить.
        // В релизе остаётся поведение по умолчанию — смешанный контент запрещён.
        if (isDebugBuild()) {
            this.bridge.getWebView().getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        applyDarkSystemBars();
    }

    // Системные бары по умолчанию берут вид из темы ТЕЛЕФОНА, а не приложения:
    // при светлой системной теме внизу появлялась светло-серая полоса с тёмными
    // значками, резко выбивавшаяся из тёмного оформления.
    //
    // Начиная с Android 15 заданный цвет панели система игнорирует — вместо
    // этого она сама подкладывает под прозрачную панель полупрозрачную подложку
    // ("contrast"), подбирая её под свою тему. Подложку выключаем: под кнопками
    // остаётся фон самого приложения, который рисует веб-слой.
    //
    // Цвет значков здесь только начальный, по умолчанию приложения (тёмная
    // тема). Дальше им управляет SystemBarsPlugin: пользователь может
    // переключить тему в Профиле, и значки обязаны переключиться вместе с ней,
    // иначе на светлой теме станут невидимыми.
    private void applyDarkSystemBars() {
        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        // false = светлые (белые) значки, рассчитанные на тёмный фон.
        controller.setAppearanceLightNavigationBars(false);
        controller.setAppearanceLightStatusBars(false);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setNavigationBarContrastEnforced(false);
        }
        // Для Android 14 и старее цвет панели ещё учитывается — задаём его явно.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) {
            getWindow().setNavigationBarColor(Color.parseColor("#070710"));
        }
    }

    // Отладочная сборка определяется по флагу самого приложения, а не по
    // BuildConfig.DEBUG: генерация BuildConfig в проекте отключена (поведение
    // по умолчанию у новых версий Android Gradle Plugin), и обращение к нему
    // просто не компилируется.
    private boolean isDebugBuild() {
        return (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
    }
}
