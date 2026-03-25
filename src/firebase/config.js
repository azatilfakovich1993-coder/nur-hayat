import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// ⚠️ Замените на ваши реальные данные из Firebase Console
// https://console.firebase.google.com → Project Settings → General → Your apps
const firebaseConfig = {
  apiKey:            "ВАША_API_KEY",
  authDomain:        "ВАШЕ_PROJECT.firebaseapp.com",
  projectId:         "ВАШЕ_PROJECT_ID",
  storageBucket:     "ВАШЕ_PROJECT.appspot.com",
  messagingSenderId: "ВАШЕ_SENDER_ID",
  appId:             "ВАШЕ_APP_ID"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db   = getFirestore(app)
export default app
