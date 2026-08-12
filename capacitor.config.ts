import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.nurhayat.islam',
  appName: 'Nur Hayat',
  webDir: 'dist',
  server: {
    // Для продакшена — убери androidScheme если хочешь работать полностью оффлайн
    // androidScheme: 'https',
  },
  android: {
    backgroundColor: '#070710',
    // Иконка берётся из android/app/src/main/res/
  },
  // Приложение не пишет в системный журнал в боевой сборке — это поведение
  // Capacitor по умолчанию. Если снова понадобится ловить ошибку на живом
  // телефоне, временно поставь сюда loggingBehavior: 'production', собери,
  // сними лог через adb logcat с меткой Capacitor/Console — и убери обратно.
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#070710',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}

export default config
