import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

const CARD_W = 1080
const CARD_H = 1920

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const test = line ? line + ' ' + word : word
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

// Карточка-картинка для шеринга в статус WhatsApp/Telegram — формат 1080x1920
// (вертикальный, как у историй), оформление в стиле приложения.
export async function generateShareCard({ kind, arabic, translit, translation, source }) {
  try { await document.fonts.ready } catch {}

  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')

  // Фон — тёмный градиент + мягкое золотое сияние, как карточки в приложении
  const bg = ctx.createLinearGradient(0, 0, 0, CARD_H)
  bg.addColorStop(0, '#0a0a18')
  bg.addColorStop(1, '#070710')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  const glow = ctx.createRadialGradient(CARD_W / 2, CARD_H * 0.32, 20, CARD_W / 2, CARD_H * 0.32, CARD_W * 0.75)
  glow.addColorStop(0, 'rgba(201,168,76,0.16)')
  glow.addColorStop(1, 'rgba(201,168,76,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  ctx.textAlign = 'center'

  // Декоративная кавычка
  ctx.font = '300px Georgia, serif'
  ctx.fillStyle = 'rgba(201,168,76,0.07)'
  ctx.fillText('"', CARD_W / 2, 360)

  // Заголовок (АЯТ ДНЯ / ХАДИС ДНЯ)
  ctx.font = '600 32px Inter, sans-serif'
  ctx.fillStyle = '#C9A84C'
  ctx.fillText(
    kind === 'hadith' ? 'Х А Д И С   Д Н Я' : kind === 'eid' ? 'С   П Р А З Д Н И К О М' : 'А Я Т   Д Н Я',
    CARD_W / 2, 170,
  )

  let y = 420

  // Арабский текст
  ctx.direction = 'rtl'
  ctx.font = '700 64px "Scheherazade New", "Amiri", serif'
  ctx.fillStyle = '#F0D080'
  for (const line of wrapText(ctx, arabic, CARD_W - 160)) {
    ctx.fillText(line, CARD_W / 2, y)
    y += 92
  }
  ctx.direction = 'ltr'

  if (translit) {
    y += 16
    ctx.font = 'italic 30px Inter, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    for (const line of wrapText(ctx, translit, CARD_W - 180)) {
      ctx.fillText(line, CARD_W / 2, y)
      y += 42
    }
  }

  y += 56
  ctx.strokeStyle = 'rgba(201,168,76,0.4)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(CARD_W / 2 - 60, y)
  ctx.lineTo(CARD_W / 2 + 60, y)
  ctx.stroke()
  y += 76

  // Перевод
  ctx.font = '42px Inter, sans-serif'
  ctx.fillStyle = '#ffffff'
  for (const line of wrapText(ctx, translation, CARD_W - 200)) {
    ctx.fillText(line, CARD_W / 2, y)
    y += 58
  }

  y += 44
  ctx.font = '600 30px Inter, sans-serif'
  ctx.fillStyle = '#C9A84C'
  ctx.fillText(source, CARD_W / 2, y)

  // Брендинг внизу. Ссылки в саму картинку класть бессмысленно — текст на
  // изображении не кликабелен ни в одном мессенджере; настоящие ссылки
  // идут подписью к файлу (см. shareCardImage), здесь — только название
  // приложения, чтобы было видно, откуда карточка.
  ctx.font = '600 42px Inter, sans-serif'
  ctx.fillStyle = '#C9A84C'
  ctx.fillText('🌙 Nur Hayat', CARD_W / 2, CARD_H - 150)
  ctx.font = '28px Inter, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.fillText('Скачайте в RuStore', CARD_W / 2, CARD_H - 108)
  ctx.fillText('или на nurhayat-78bc5.web.app', CARD_W / 2, CARD_H - 70)

  return await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Текст-подпись с настоящими ссылками — в саму картинку их не вставить
// (текст на изображении не кликабелен), а вот подпись к файлу при отправке
// Telegram/WhatsApp показывают рядом с картинкой и делают ссылки активными.
export const SHARE_LINKS_TEXT =
  '🌙 Nur Hayat — исламское приложение\n\n' +
  '📱 Скачать в RuStore:\n' +
  'https://www.rustore.ru/catalog/app/app.nurhayat.islam\n\n' +
  '🌐 Открыть в браузере (без установки):\n' +
  'https://nurhayat-78bc5.web.app'

export async function shareCardImage(blob, dialogTitle, text = SHARE_LINKS_TEXT) {
  const fileName = `nur-hayat-${Date.now()}.png`

  if (Capacitor.isNativePlatform()) {
    try {
      const base64 = await blobToBase64(blob)
      const written = await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache })
      await Share.share({ files: [written.uri], text, dialogTitle })
    } catch (err) {
      console.warn('[ShareCard] native share failed:', err?.message)
    }
    return
  }

  try {
    const file = new File([blob], fileName, { type: 'image/png' })
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text, title: dialogTitle })
      return
    }
  } catch (err) {
    console.warn('[ShareCard] web share failed:', err?.message)
  }

  // Запасной путь — просто скачать картинку, если "Поделиться" недоступно
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
