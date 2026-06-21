import { Haptics } from '@capacitor/haptics'
import { Capacitor } from '@capacitor/core'

let audioCtx = null

// Короткий синтезированный "тап" — без аудиофайла, через Web Audio API.
// Работает и в браузере, и в нативном приложении; уважает громкость медиа.
// AudioContext стартует в состоянии "suspended" пока его не разблокирует
// прямой тап пользователя — поэтому resume() обязательно ждём, иначе звук
// может тихо "потеряться" (например при срабатывании по скроллу, не по тапу).
async function playTapSound(freq = 880, duration = 0.05) {
  try {
    // WebView иногда переводит контекст в 'closed' сам (например, после
    // долгого фона) — старый объект уже не оживить, нужен новый экземпляр
    if (audioCtx?.state === 'closed') audioCtx = null
    audioCtx ??= new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtx.state === 'suspended') await audioCtx.resume()
    const osc  = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.frequency.value = freq
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start()
    osc.stop(audioCtx.currentTime + duration)
  } catch (err) {
    console.warn('[Feedback] sound failed:', err?.message)
  }
}

// Haptics.vibrate() дёргает Vibrator.vibrate() напрямую одним импульсом —
// надёжнее, чем impact()/notification(), которые шлют waveform-паттерн
// и на некоторых прошивках (бюджетные Xiaomi/MIUI) тихо игнорируются.
async function vibrate(duration = 40) {
  if (!Capacitor.isNativePlatform()) return
  try {
    await Haptics.vibrate({ duration })
  } catch (err) {
    console.warn('[Feedback] vibration failed:', err?.message)
  }
}

// Лёгкий тап — для обычных действий (ответить, реакция, отправка)
export function tapFeedback() {
  vibrate(35)
  playTapSound(880, 0.04)
}

// Более заметный отклик — для начисления НУР / наград
export function rewardFeedback() {
  vibrate(70)
  playTapSound(1100, 0.07)
}

// Входящее сообщение от другого пользователя, пока чат открыт
export function incomingMessageFeedback() {
  vibrate(25)
  playTapSound(660, 0.05)
}
