package app.nurhayat.islam;

import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Открывает системные настройки самого приложения.
 *
 * Нужно для случая, когда человек отказал в доступе к местоположению. Плагина
 * геолокации в проекте нет — приложение просто пользуется тем разрешением,
 * которое уже выдано, и запросить его заново не может. Особенно если Android
 * запомнил отказ: тогда системное окно больше не появится вообще, и кнопка
 * "попробовать снова" будет молча упираться в тот же отказ.
 *
 * Поэтому даём прямой путь туда, где разрешение можно выдать руками.
 */
@CapacitorPlugin(name = "DeviceSettings")
public class DeviceSettingsPlugin extends Plugin {

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        try {
            Intent intent = new Intent(
                Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                Uri.fromParts("package", getContext().getPackageName(), null));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Не удалось открыть настройки приложения", e);
        }
    }
}
