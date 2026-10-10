// Money maths and formatting helpers.

const gbp = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const formatGBP = (n) => gbp.format(Number.isFinite(n) ? n : 0)

export function formatMinutes(m) {
  const mins = Math.round(m)
  if (mins >= 60) {
    const h = Math.floor(mins / 60)
    const r = mins % 60
    return r ? `${h}h ${r}m` : `${h}h`
  }
  return `${mins} min`
}

export const pluralise = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n))
export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100
export const round05 = (n) => Math.round(n * 2) / 2
// Round UP to the nearest penny so slices always add up to at least the locked amount.
export const ceil2 = (n) => Math.ceil(n * 100 - 1e-9) / 100
