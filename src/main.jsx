import React from 'react'
import ReactDOM from 'react-dom/client'
import { Preferences } from '@capacitor/preferences'
import App from './App'

// Восстанавливаем сессию из нативного хранилища ДО инициализации Supabase
// Таймаут 1.5с — на вебе Capacitor Preferences может зависнуть
async function restoreAndRender() {
  try {
    const { value } = await Promise.race([
      Preferences.get({ key: 'nur-hayat-auth' }),
      new Promise(r => setTimeout(() => r({ value: null }), 1500))
    ])
    if (value) localStorage.setItem('nur-hayat-auth', value)
  } catch {}

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

restoreAndRender()
