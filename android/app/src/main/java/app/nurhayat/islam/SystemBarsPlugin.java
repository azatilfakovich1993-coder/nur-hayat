package app.nurhayat.islam;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Согласует вид системных баров Android с темой приложения.
 *
 * Тема переключается в самом приложении (Профиль → Тема оформления) и живёт в
 * веб-слое, а цвет значков в статус-баре и на панели навигации задаётся только
 * нативно. Без этого моста значки оставались бы фиксированными: белые значки
 * на светлой теме сливались бы с фоном и кнопки навигации стали бы невидимы.
 */
@CapacitorPlugin(name = "SystemBars")
public class SystemBarsPlugin extends Plugin {

    @PluginMethod
    public void setDarkTheme(PluginCall call) {
        final boolean dark = call.getBoolean("dark", true);
        getActivity().runOnUiThread(() -> {
            WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(
                getActivity().getWindow(), getActivity().getWindow().getDecorView());
            // "Light bars" означает СВЕТЛЫЙ ФОН под значками, поэтому значки
            // рисуются тёмными. Для тёмной темы приложения нужно обратное.
            controller.setAppearanceLightStatusBars(!dark);
            controller.setAppearanceLightNavigationBars(!dark);
            call.resolve();
        });
    }
}
