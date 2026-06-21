// Календарная дата по МЕСТНОМУ времени, не UTC. date.toISOString() сдвигает
// дату на день назад ночью (когда местное время впереди UTC, как в РФ) —
// из-за этого, например, намаз отмеченный после полуночи попадал во вчера.
export function localDateStr(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
