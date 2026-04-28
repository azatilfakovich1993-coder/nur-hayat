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
