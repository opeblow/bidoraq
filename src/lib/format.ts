export function formatMoney(kobo: string | bigint, currency: 'NGN' | 'USD' = 'NGN') {
  const amount = Number(BigInt(kobo)) / 100
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function parseMoneyToKobo(value: string) {
  const normalized = value.replace(/[^0-9.]/g, '')
  if (!normalized || Number.isNaN(Number(normalized))) return null
  const [whole, fraction = ''] = normalized.split('.')
  const padded = fraction.padEnd(2, '0').slice(0, 2)
  const kobo = BigInt(whole || '0') * 100n + BigInt(padded || '0')
  return kobo > 0n ? kobo.toString() : null
}

export function shortHash(value: string, lead = 8, tail = 6) {
  if (value.length <= lead + tail + 3) return value
  return `${value.slice(0, lead)}…${value.slice(-tail)}`
}

export function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(timestamp)
}

export function formatDateShort(timestamp: number) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  }).format(timestamp)
}

export function formatCountdown(target: number, now: number) {
  const diff = target - now
  if (diff <= 0) return 'Closed'
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  return `${minutes}m`
}

export function formatRole(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}
