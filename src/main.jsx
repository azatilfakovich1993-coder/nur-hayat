import React from 'react'
import ReactDOM from 'react-dom/client'
import { Preferences } from '@capacitor/preferences'
import App from './App'

// Восстанавливаем сессию из нативного хранилища ДО инициализации Supabase
async function restoreAndRender() {
  try {
    const { value } = await Preferences.get({ key: 'nur-hayat-auth' })
    if (value) localStorage.setItem('nur-hayat-auth', value)
  } catch {}

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

restoreAndRender()
