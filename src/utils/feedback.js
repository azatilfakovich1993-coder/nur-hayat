import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { Capacitor } from '@capacitor/core'

let audioCtx = null

// Короткий синтезированный "тап" — без аудиофайла, через Web Audio API.
// Работает и в браузере, и в нативном приложении; уважает громкость медиа.
function playTapSound(freq = 880, duration = 0.05) {
  try {
    audioCtx ??= new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtx.state === 'suspended') audioCtx.resume()
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
  } catch {}
}

async function vibrate(style) {
  if (!Capacitor.isNativePlatform()) return
  try { await Haptics.impact({ style }) } catch {}
}

// Лёгкий тап — для обычных действий (ответить, реакция, отправка)
export function tapFeedback() {
  vibrate(ImpactStyle.Light)
  playTapSound(880, 0.04)
}

// Более заметный отклик — для начисления НУР / наград
export async function rewardFeedback() {
  if (Capacitor.isNativePlatform()) {
    try { await Haptics.notification({ type: NotificationType.SUCCESS }) } catch {}
  } else {
    vibrate(ImpactStyle.Medium)
  }
  playTapSound(1100, 0.07)
}
