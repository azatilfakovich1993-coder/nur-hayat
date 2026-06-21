// Общая обёртка для сетевых запросов к Supabase. Раньше почти каждый файл
// держал свою копию withTimeout с одной попыткой — под VPN/плохой сетью
// один таймаут легко ловится там, где запрос на самом деле просто выполнялся
// на пару секунд дольше обычного. withRetry даёт несколько попыток с паузой
// между ними, чтобы транзитная медленность не превращалась в ошибку на экране.

export function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

export function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// fn — функция БЕЗ аргументов, возвращающая промис (вызывается заново на каждой попытке)
export async function withRetry(fn, { attempts = 3, timeoutMs = 20000, backoffMs = 1200 } = {}) {
  let lastErr
  for (let i = 1; i <= attempts; i++) {
    try {
      return await withTimeout(fn(), timeoutMs)
    } catch (err) {
      lastErr = err
      if (i < attempts) await sleep(backoffMs * i)
    }
  }
  throw lastErr
}
