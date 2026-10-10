// Date helpers. The app runs on a simulated "demo date" stored as an ISO string (YYYY-MM-DD)
// so fast-forwarding days never depends on the real clock.

const pad = (n) => String(n).padStart(2, '0')

export function toISODate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Noon avoids daylight-saving edge cases when adding days.
export function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

export function addDays(iso, n) {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

export function diffDays(a, b) {
  return Math.round((parseISODate(a) - parseISODate(b)) / 86400000)
}

export function nowTime() {
  const n = new Date()
  return `${pad(n.getHours())}:${pad(n.getMinutes())}`
}

const short = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })
const long = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short' })

export const formatShortDate = (iso) => short.format(parseISODate(iso))
export const formatLongDate = (iso) => long.format(parseISODate(iso))
export const formatWeekday = (iso) => weekday.format(parseISODate(iso))

export function relativeDay(iso, todayIso) {
  const diff = diffDays(todayIso, iso)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return formatShortDate(iso)
}
